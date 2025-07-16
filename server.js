// ===============================================
// ||           PORTAL DO PROFESSOR             ||
// ||         SERVER.JS (VERSÃO CORRIGIDA)      ||
// ===============================================

// --- 1. IMPORTAÇÃO DOS MÓDULOS ---
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const db = require('./database/db');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateProfessor = require('./middleware/authenticateProfessor');
const JWT_SECRET = 'R!d1sRIbeir0';
const authenticateAluno = require('./middleware/authenticateAluno');
const JWT_SECRET_ALUNO = 'R!d1sRIbeir0!';

// --- 2. VERIFICAÇÃO INICIAL DO BANCO DE DADOS ---
const dbPath = path.resolve(__dirname, 'database/portal.db');
if (!fs.existsSync(dbPath)) {
    console.error("\n[ERRO CRÍTICO] O arquivo de banco de dados 'portal.db' não foi encontrado!");
    console.error("Execute o comando 'npm run db:setup' para criar e configurar o banco de dados antes de iniciar o servidor.\n");
    process.exit(1);
}

// --- 3. CONFIGURAÇÃO DO MULTER PARA UPLOAD DE ARQUIVOS ---
const createMulterStorage = (destination) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, 'public', destination);
            fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
};

const imageUpload = multer({ storage: createMulterStorage('uploads/images') });
const materialUpload = multer({ storage: createMulterStorage('uploads/materiais') });
const portfolioMediaUpload = multer({ storage: createMulterStorage('uploads/portfolio') });

const projectFormHandler = portfolioMediaUpload.fields([
    { name: 'imagem_capa', maxCount: 1 },
    { name: 'fotos', maxCount: 10 }
]);

const materialFormHandler = materialUpload.fields([
    { name: 'imagem_capa', maxCount: 1 },
    { name: 'materialFile', maxCount: 10 }
]);

const singleImageUpload = portfolioMediaUpload.single('file');


// --- 4. INICIALIZAÇÃO DO EXPRESS ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 5. MIDDLEWARES GLOBAIS ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- MIDDLEWARE DE AUTENTICAÇÃO COMBINADO ---
function checkCombinedAuthStatus(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        req.aluno = null;
        req.professor = null;
        return next();
    }

    try {
        const decodedProfessor = jwt.verify(token, JWT_SECRET);
        req.professor = decodedProfessor;
        req.aluno = null;
        return next();
    } catch (ex) {
        try {
            const decodedAluno = jwt.verify(token, JWT_SECRET_ALUNO);
            req.aluno = decodedAluno;
            req.professor = null;
            return next();
        } catch (ex2) {
            req.aluno = null;
            req.professor = null;
            return next();
        }
    }
}

// ===============================================
// ||              ROTAS DA API                 ||
// ===============================================

// ROTA DE STATUS DE LOGIN (para saber quem está logado no frontend)
app.get('/api/auth/status', checkCombinedAuthStatus, (req, res) => {
    if (req.professor) {
        res.json({ loggedIn: true, role: 'professor', user: req.professor });
    } else if (req.aluno) {
        res.json({ loggedIn: true, role: 'aluno', user: req.aluno });
    } else {
        res.json({ loggedIn: false });
    }
});

// ROTA PARA VERIFICAR SE O E-MAIL DE UM ALUNO JÁ EXISTE
app.post('/api/alunos/check-email', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }
    try {
        const aluno = await db('alunos').where({ email }).first();
        res.json({ exists: !!aluno });
    } catch (err) {
        console.error("Erro ao verificar e-mail:", err);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE CADASTRO DE ALUNO
app.post('/api/alunos/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    try {
        const alunoExistente = await db('alunos').where({ email }).first();
        if (alunoExistente) {
            return res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const [id] = await db('alunos').insert({ nome, email, senha: senhaHash }).returning('id');
        res.status(201).json({ success: true, message: 'Cadastro realizado com sucesso!', alunoId: id });
    } catch (err) {
        console.error("Erro no cadastro do aluno:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor. Tente novamente.' });
    }
});

app.post('/api/alunos/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }
    try {
        const aluno = await db('alunos').where({ email }).first();
        if (!aluno) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        const senhaCorreta = await bcrypt.compare(senha, aluno.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        const token = jwt.sign(
            { id: aluno.id, nome: aluno.nome, email: aluno.email, imagem_url: aluno.imagem_url, role: 'aluno' },
            JWT_SECRET_ALUNO,
            { expiresIn: '8h' }
        );
        res.json({
            success: true,
            message: 'Login bem-sucedido!',
            token: token,
            aluno: { id: aluno.id, nome: aluno.nome, email: aluno.email, imagem_url: aluno.imagem_url }
        });
    } catch (err) {
        console.error("Erro no login do aluno:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor. Tente novamente.' });
    }
});


app.post('/api/alunos/profile/picture', authenticateAluno, imageUpload.single('alunoProfilePicture'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' });
    }
    try {
        const imagem_url = `/uploads/images/${req.file.filename}`;
        await db('alunos').where('id', req.aluno.id).update({ imagem_url });
        res.json({ success: true, imagem_url });
    } catch (err) {
        console.error("Erro ao fazer upload da foto de perfil do aluno:", err);
        res.status(500).json({ message: `Erro interno ao processar a imagem: ${err.message}` });
    }
});

// API: LOGIN PROFESSOR
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }
    try {
        const professor = await db('perfil').where({ email }).first();
        if (!professor) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        const senhaCorreta = await bcrypt.compare(senha, professor.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }
        
        const payload = { 
            id: professor.id, 
            nome: professor.nome, 
            role: 'professor' 
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        res.json({ 
            success: true, 
            token: token,
            professor: payload 
        });

    } catch (err) {
        console.error("Erro no login do professor:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

// API: PERFIL
app.get('/api/profile', authenticateProfessor, async (req, res) => {
    try {
        const profile = await db('perfil').where({ id: req.professor.id }).first();
        if (profile) {
            const customLinks = await db('perfil_links').where({ perfil_id: req.professor.id });
            profile.custom_links = customLinks;
            res.json(profile);
        } else {
            res.status(404).json({ message: "Perfil não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        res.status(500).json({ message: "Erro ao buscar perfil." });
    }
});

app.put('/api/profile', authenticateProfessor, async (req, res) => {
    const { custom_links, ...profileData } = req.body;
    const trx = await db.transaction();
    try {
        await trx('perfil').where('id', req.professor.id).update(profileData);
        await trx('perfil_links').where('perfil_id', req.professor.id).del();
        if (custom_links && custom_links.length > 0) {
            const linksToInsert = custom_links
                .filter(link => link.label && link.url)
                .map(link => ({
                    ...link,
                    perfil_id: req.professor.id
                }));
            if (linksToInsert.length > 0) {
              await trx('perfil_links').insert(linksToInsert);
            }
        }
        await trx.commit();
        const updatedProfile = await db('perfil').where('id', req.professor.id).first();
        const updatedLinks = await db('perfil_links').where({ perfil_id: req.professor.id });
        updatedProfile.custom_links = updatedLinks;
        res.json(updatedProfile);
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao salvar perfil:", err);
        res.status(500).json({ message: "Erro ao salvar perfil." });
    }
});

app.post('/api/profile/picture', authenticateProfessor, imageUpload.single('profilePicture'), async (req, res) => {
    if (!req.file) { return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' }); }
    try {
        const imagem_url = `/uploads/images/${req.file.filename}`;
        await db('perfil').where('id', req.professor.id).update({ imagem_url });
        const updatedProfile = await db('perfil').where('id', req.professor.id).first();
        res.json(updatedProfile);
    } catch (err) {
        console.error("ERRO DETALHADO ao fazer upload da foto de perfil:", err);
        res.status(500).json({ message: `Erro interno ao processar a imagem: ${err.message}` });
    }
});


// ROTA DE PERFIL PÚBLICO
app.get('/api/public-profile', async (req, res) => {
    try {
        const profile = await db('perfil').where({ id: 1 }).first(); 
        if (profile) {
            delete profile.senha;
            const customLinks = await db('perfil_links').where({ perfil_id: 1 });
            profile.custom_links = customLinks;
            res.json(profile);
        } else {
            res.status(404).json({ message: "Perfil principal não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao buscar perfil público:", err);
        res.status(500).json({ message: "Erro ao buscar perfil." });
    }
});


// API: SOBRE
app.get('/api/sobre', async (req, res) => {
    try {
        const sobreConteudos = await db('sobre_conteudo').select('*');
        const sobreObjeto = sobreConteudos.reduce((obj, item) => {
            obj[item.secao] = item.conteudo;
            return obj;
        }, {});
        res.json(sobreObjeto);
    } catch (err) {
        console.error("Erro ao buscar conteúdo da página Sobre:", err);
        res.status(500).json({ message: "Erro ao buscar conteúdo." });
    }
});

app.put('/api/sobre', authenticateProfessor, async (req, res) => {
    const { formacao, interesses } = req.body;
    const trx = await db.transaction();
    try {
        await trx('sobre_conteudo').where('secao', 'formacao').update({ conteudo: formacao });
        await trx('sobre_conteudo').where('secao', 'interesses').update({ conteudo: interesses });
        await trx.commit();
        res.status(200).json({ success: true, message: 'Página "Sobre" atualizada com sucesso!' });
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao atualizar conteúdo da página Sobre:", err);
        res.status(500).json({ message: "Erro ao atualizar conteúdo." });
    }
});

// API: MENSAGENS
app.post('/api/mensagens', checkCombinedAuthStatus , async (req, res) => {
    const { assunto, corpo, nome, email } = req.body;

    if (!assunto || !corpo || !nome || !email) {
        return res.status(400).json({ message: "Todos os campos (nome, email, assunto e mensagem) são obrigatórios." });
    }
    try {
        if (!req.aluno) {
            const alunoExistente = await db('alunos').where({ email }).first();
            // Se o e-mail digitado pertence a um aluno já cadastrado, retornamos um erro específico.
            if (alunoExistente) {
                return res.status(409).json({ // 409 Conflict
                    error: 'EMAIL_EXISTS_LOGIN_REQUIRED',
                    message: "Este e-mail já pertence a uma conta. Por favor, faça o login para enviar a mensagem."
                });
            }
        }

        const novaMensagem = {
            aluno_id: req.aluno ? req.aluno.id : null, 
            remetente_nome: req.aluno ? req.aluno.nome : nome, // Usa os dados do token se logado
            remetente_email: req.aluno ? req.aluno.email : email,
            assunto,
            corpo
        };
        await db('mensagens').insert(novaMensagem);
        res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso!' });
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
        res.status(500).json({ message: "Erro interno ao enviar mensagem." });
    }
});

app.get('/api/mensagens', authenticateProfessor, async (req, res) => {
    try {
        const mensagens = await db('mensagens').select('*').orderBy('data_envio', 'desc');
        res.json(mensagens);
    } catch (err) { res.status(500).json({ message: "Erro ao buscar mensagens." }); }
});

app.put('/api/mensagens/:id/read', authenticateProfessor, async (req, res) => {
    try {
        await db('mensagens').where({ id: req.params.id }).update({ lida: true });
        res.status(200).json({ success: true, message: 'Mensagem marcada como lida.' });
    } catch (err) { res.status(500).json({ message: "Erro ao atualizar mensagem." }); }
});

app.delete('/api/mensagens/:id', authenticateProfessor, async (req, res) => {
    try {
        const count = await db('mensagens').where({ id: req.params.id }).del();
        if (count > 0) res.status(204).send();
        else res.status(404).json({ message: "Mensagem não encontrada." });
    } catch (err) { res.status(500).json({ message: "Erro ao apagar mensagem." }); }
});

// API: MATERIAIS
app.get('/api/materiais', async (req, res) => {
    try {
        const materiais = await db('materiais').select('*').orderBy('data_upload', 'desc');
        if (materiais.length === 0) {
            return res.json([]);
        }
        const materialIds = materiais.map(m => m.id);
        const arquivos = await db('material_arquivos').whereIn('material_id', materialIds);

        const arquivosMap = arquivos.reduce((map, arquivo) => {
            if (!map[arquivo.material_id]) {
                map[arquivo.material_id] = [];
            }
            map[arquivo.material_id].push(arquivo);
            return map;
        }, {});

        const result = materiais.map(material => ({
            ...material,
            arquivos: arquivosMap[material.id] || []
        }));
        
        res.json(result);
    } catch (err) {
        console.error("Erro ao buscar materiais:", err);
        res.status(500).json({ message: "Erro ao buscar materiais." });
    }
});

app.post('/api/materiais', authenticateProfessor, materialFormHandler, async (req, res) => {
    const trx = await db.transaction();
    try {
        const { titulo, descricao, categoria, link_externo } = req.body;
        const materialData = { titulo, descricao, categoria, link_externo };

        // >>> INÍCIO DA CORREÇÃO 1 <<<
        // A imagem de capa de um material deve ser salva na pasta de materiais.
        if (req.files.imagem_capa) {
            materialData.imagem_capa_url = `/uploads/materiais/${req.files.imagem_capa[0].filename}`;
        }
        // >>> FIM DA CORREÇÃO 1 <<<
        
        const [result] = await trx('materiais').insert(materialData).returning('id');
        const materialId = result ? (typeof result === 'object' ? result.id : result) : null;
        if (!materialId) throw new Error("Falha ao obter o ID do novo material após a inserção.");
        
        if (req.files.materialFile && req.files.materialFile.length > 0) {
            const arquivosParaInserir = req.files.materialFile.map(file => ({
                material_id: materialId,
                nome_arquivo: file.originalname,
                caminho_arquivo: `/uploads/materiais/${file.filename}`,
                tipo_arquivo: file.mimetype,
                tamanho_arquivo: `${(file.size / 1024 / 1024).toFixed(2)} MB`
            }));
            await trx('material_arquivos').insert(arquivosParaInserir);
        } else if (!link_externo) {
            await trx.rollback();
            return res.status(400).json({ message: "É necessário enviar pelo menos um arquivo ou um link externo." });
        }

        await trx.commit();
        const newMaterial = await db('materiais').where({ id: materialId }).first();
        res.status(201).json(newMaterial);
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao adicionar material:", err);
        res.status(500).json({ message: "Erro ao salvar material." });
    }
});

app.put('/api/materiais/:id', authenticateProfessor, materialFormHandler, async (req, res) => {
    const { id } = req.params;
    const trx = await db.transaction();

    try {
        const { titulo, descricao, categoria, link_externo } = req.body;
        const updateData = { titulo, descricao, categoria, link_externo };

        const materialAtual = await trx('materiais').where({ id }).first();
        if (!materialAtual) {
            await trx.rollback();
            return res.status(404).json({ message: 'Material não encontrado.' });
        }

        // >>> INÍCIO DA CORREÇÃO 2 <<<
        // Garante que a URL da imagem de capa editada aponte para a pasta correta.
        if (req.files.imagem_capa) {
            updateData.imagem_capa_url = `/uploads/materiais/${req.files.imagem_capa[0].filename}`;
            if (materialAtual.imagem_capa_url) {
                const oldCapaPath = path.join(__dirname, 'public', materialAtual.imagem_capa_url);
                if (fs.existsSync(oldCapaPath)) fs.unlinkSync(oldCapaPath);
            }
        }
        // >>> FIM DA CORREÇÃO 2 <<<

        await trx('materiais').where({ id }).update(updateData);

        if (req.files.materialFile && req.files.materialFile.length > 0) {
            const arquivosAntigos = await trx('material_arquivos').where({ material_id: id });
            for (const arquivo of arquivosAntigos) {
                const filePath = path.join(__dirname, 'public', arquivo.caminho_arquivo);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await trx('material_arquivos').where({ material_id: id }).del();

            const arquivosParaInserir = req.files.materialFile.map(file => ({
                material_id: id,
                nome_arquivo: file.originalname,
                caminho_arquivo: `/uploads/materiais/${file.filename}`,
                tipo_arquivo: file.mimetype,
                tamanho_arquivo: `${(file.size / 1024 / 1024).toFixed(2)} MB`
            }));
            await trx('material_arquivos').insert(arquivosParaInserir);
        }

        await trx.commit();
        const materialAtualizado = await db('materiais').where({ id }).first();
        res.status(200).json(materialAtualizado);

    } catch (err) {
        await trx.rollback();
        console.error("Erro ao atualizar material:", err);
        res.status(500).json({ message: "Erro ao atualizar material." });
    }
});

app.delete('/api/materiais/:id', authenticateProfessor, async (req, res) => {
    const trx = await db.transaction();
    try {
        const { id } = req.params;
        const material = await trx('materiais').where({ id }).first();
        if (!material) {
            await trx.rollback();
            return res.status(404).json({ message: "Material não encontrado." });
        }
        
        if (material.imagem_capa_url) {
            const capaPath = path.join(__dirname, 'public', material.imagem_capa_url);
            if (fs.existsSync(capaPath)) fs.unlinkSync(capaPath);
        }

        const arquivos = await trx('material_arquivos').where({ material_id: id });
        for (const arquivo of arquivos) {
            const filePath = path.join(__dirname, 'public', arquivo.caminho_arquivo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        await trx('material_arquivos').where({ material_id: id }).del();
        await trx('materiais').where({ id }).del();
        
        await trx.commit();
        res.status(204).send();
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao apagar material:", err);
        res.status(500).json({ message: "Erro ao apagar material." });
    }
});

app.post('/api/projetos/upload-image', authenticateProfessor, singleImageUpload, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    res.json({ location: `/uploads/portfolio/${req.file.filename}` });
});

// API: PROJETOS (Portfólio)
app.get('/api/projetos', async (req, res) => {
    try {
        res.json(await db('projetos').select('*').orderBy('id', 'desc'));
    } catch (err) { res.status(500).json({ message: "Erro ao buscar projetos." }); }
});

app.post('/api/projetos', authenticateProfessor, projectFormHandler, async (req, res) => {
    const { titulo, descricao, categoria, status, periodo, tags, link_externo } = req.body;
    const trx = await db.transaction();
    try {
        let capaUrl = null;
        if (req.files && req.files.imagem_capa) {
            capaUrl = `/uploads/portfolio/${req.files.imagem_capa[0].filename}`;
        }

        const [projetoResult] = await trx('projetos').insert({
            titulo, descricao, categoria, status, periodo, tags, link_externo,
            imagem_capa_url: capaUrl
        }).returning('id');

        const projetoId = typeof projetoResult === 'object' ? projetoResult.id : projetoResult;
        
        if (req.files && req.files.fotos) {
            const medias = req.files.fotos.map(file => ({
                caminho_arquivo: `/uploads/portfolio/${file.filename}`,
                tipo_midia: 'imagem',
                projeto_id: projetoId
            }));
            await trx('portfolio_media').insert(medias);
        }

        await trx.commit();
        const novoProjeto = await db('projetos').where({ id: projetoId }).first();
        res.status(201).json(novoProjeto);
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao adicionar projeto:", err);
        res.status(500).json({ message: "Erro ao salvar projeto." });
    }
});

app.post('/api/projetos/:id', authenticateProfessor, projectFormHandler, async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, categoria, status, periodo, tags, link_externo } = req.body;
    const trx = await db.transaction();
    try {
        const updateData = { titulo, descricao, categoria, status, periodo, tags, link_externo };

        if (req.files && req.files.imagem_capa) {
            updateData.imagem_capa_url = `/uploads/portfolio/${req.files.imagem_capa[0].filename}`;
        }

        await trx('projetos').where({ id }).update(updateData);
        
        if (req.files && req.files.fotos) {
            const medias = req.files.fotos.map(file => ({
                caminho_arquivo: `/uploads/portfolio/${file.filename}`,
                tipo_midia: 'imagem',
                projeto_id: id
            }));
            await trx('portfolio_media').insert(medias);
        }

        await trx.commit();
        const projetoAtualizado = await db('projetos').where({ id }).first();
        res.status(200).json(projetoAtualizado);
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao atualizar projeto:", err);
        res.status(500).json({ message: "Erro ao atualizar projeto." });
    }
});


app.get('/api/projetos/:id/detalhes', async (req, res) => {
    try {
        const { id } = req.params;
        const projeto = await db('projetos').where({ id }).first();
        if (!projeto) return res.status(404).json({ message: "Projeto não encontrado." });
        const midias = await db('portfolio_media').where({ projeto_id: id });
        projeto.midias = midias;
        res.json(projeto);
    } catch (err) {
        console.error("Erro ao buscar detalhes do projeto:", err);
        res.status(500).json({ message: "Erro ao buscar detalhes do projeto." });
    }
});

app.delete('/api/projetos/:id', authenticateProfessor, async (req, res) => {
    const { id } = req.params;
    const trx = await db.transaction();
    try {
        const midiasParaApagar = await trx('portfolio_media').where({ projeto_id: id });
        if (midiasParaApagar.length > 0) {
            midiasParaApagar.forEach(media => {
                if (media.caminho_arquivo.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, 'public', media.caminho_arquivo);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            });
        }
        await trx('portfolio_media').where({ projeto_id: id }).del();
        const count = await trx('projetos').where({ id }).del();
        await trx.commit();
        if (count > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Projeto não encontrado." });
        }
    } catch (err) {
        await trx.rollback();
        console.error("Erro ao apagar projeto e suas mídias:", err);
        res.status(500).json({ message: "Erro ao apagar projeto." });
    }
});


// API: EVENTOS (Agenda)
app.get('/api/eventos', authenticateProfessor, async (req, res) => {
    try { 
        res.json(await db('eventos').select('*').orderBy('date', 'asc')); 
    } catch (err) { 
        res.status(500).json({ message: "Erro ao buscar eventos." }); 
    }
});

app.post('/api/eventos', authenticateProfessor, async (req, res) => {
    try {
        const { title, date, type, cor, observacao, time } = req.body;
        
        if (time) {
            const eventoExistente = await db('eventos').where({ date, time }).first();
            if (eventoExistente) {
                return res.status(409).json({ message: "Já existe um evento agendado para esta data e horário." });
            }
        }

        const [id] = await db('eventos').insert({ title, date, type, cor, observacao, time }).returning('id');
        const newId = typeof id === 'object' ? id.id : id;
        res.status(201).json(await db('eventos').where({ id: newId }).first());
    } catch (err) { 
        console.error("Erro ao adicionar evento:", err);
        res.status(500).json({ message: "Erro ao adicionar evento." }); 
    }
});

app.put('/api/eventos/:id', authenticateProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, type, cor, observacao, time } = req.body;
        
        if (time) {
            const eventoExistente = await db('eventos')
                .where({ date, time })
                .whereNot({ id })
                .first();

            if (eventoExistente) {
                return res.status(409).json({ message: "Já existe um evento agendado para esta data e horário." });
            }
        }
        
        const count = await db('eventos').where({ id }).update({ title, date, type, cor, observacao, time });
        
        if (count > 0) {
            res.status(200).json(await db('eventos').where({ id }).first());
        } else {
            res.status(404).json({ message: "Evento não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao atualizar evento:", err);
        res.status(500).json({ message: "Erro ao atualizar evento." });
    }
});

app.delete('/api/eventos/:id', authenticateProfessor, async (req, res) => {
    try {
        const count = await db('eventos').where('id', req.params.id).del();
        if (count > 0) res.status(204).send(); 
        else res.status(404).json({ message: "Evento não encontrado." });
    } catch (err) { 
        res.status(500).json({ message: "Erro ao apagar evento." }); 
    }
});

// API: POSTS (Blog)
app.get('/api/posts', async (req, res) => {
    try { res.json(await db('posts').select('*').orderBy('data_publicacao', 'desc')); } catch (err) { res.status(500).json({ message: "Erro ao buscar posts." }); }
});

app.post('/api/posts', authenticateProfessor, imageUpload.single('imagem'), async (req, res) => {
    try {
        const { titulo, conteudo, categoria, external_url } = req.body;
        const imagem_url = req.file ? `/uploads/images/${req.file.filename}` : null;
        const postData = { titulo, conteudo, categoria, imagem_url, external_url };
        const [id] = await db('posts').insert(postData).returning('id');
        const newId = typeof id === 'object' ? id.id : id;
        res.status(201).json(await db('posts').where({ id: newId }).first());
    } catch (err) { res.status(500).json({ message: "Erro ao salvar post." }); }
});

app.put('/api/posts/:id', authenticateProfessor, imageUpload.single('imagem'), async (req, res) => {
    const { id } = req.params;
    try {
        const { titulo, conteudo, categoria, external_url } = req.body;
        const updateData = { titulo, conteudo, categoria, external_url };

        if (req.file) {
            updateData.imagem_url = `/uploads/images/${req.file.filename}`;
        }

        const count = await db('posts').where({ id }).update(updateData);
        if (count > 0) {
            const updatedPost = await db('posts').where({ id }).first();
            res.status(200).json(updatedPost);
        } else {
            res.status(404).json({ message: "Post não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao atualizar post:", err);
        res.status(500).json({ message: "Erro ao atualizar post." });
    }
});

app.delete('/api/posts/:id', authenticateProfessor, async (req, res) => {
    try {
        const post = await db('posts').where({ id: req.params.id }).first();
        if (post && post.imagem_url) { const imagePath = path.join(__dirname, 'public', post.imagem_url); if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }
        const count = await db('posts').where({ id: req.params.id }).del();
        if (count > 0) res.status(204).send(); else res.status(404).json({ message: "Post não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao apagar post." }); }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await db('posts').where({ id: req.params.id }).first();
        if (post) res.json(post);
        else res.status(404).json({ message: "Post não encontrado." });
    } catch (err) {
        console.error("Erro ao buscar post por ID:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// API: COMENTÁRIOS
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const comments = await db('comentarios')
            .where({ post_id: req.params.id })
            .orderBy('data_publicacao', 'asc');

        if (comments.length === 0) {
            return res.json([]);
        }

        const professor = await db('perfil').select('imagem_url').where({ id: 1 }).first();
        const professorImageUrl = professor ? professor.imagem_url : null;

        const studentIds = comments
            .map(c => c.aluno_id)
            .filter(id => id !== null);
            
        let studentImagesMap = {};
        if (studentIds.length > 0) {
            const students = await db('alunos').select('id', 'imagem_url').whereIn('id', studentIds);
            students.forEach(s => {
                studentImagesMap[s.id] = s.imagem_url;
            });
        }
        
        const commentsWithImages = comments.map(comment => {
            const imageUrl = comment.aluno_id 
                ? studentImagesMap[comment.aluno_id] 
                : professorImageUrl;
            
            return { ...comment, autor_imagem_url: imageUrl };
        });

        res.json(commentsWithImages);
    } catch (err) {
        console.error("Erro ao buscar comentários:", err);
        res.status(500).json({ message: "Erro ao buscar comentários." });
    }
});

app.post('/api/comments', checkCombinedAuthStatus, async (req, res) => {
    if (!req.aluno && !req.professor) {
        return res.status(401).json({ message: "Autenticação necessária." });
    }
    try {
        const { post_id, conteudo, parent_id } = req.body;
        let autor, aluno_id = null;

        if (req.aluno) {
            autor = req.aluno.nome;
            aluno_id = req.aluno.id;
        } else {
            const professor = await db('perfil').where({ id: req.professor.id }).first();
            autor = `${professor.nome} (Professor)`;
        }

        const [commentIdResult] = await db('comentarios').insert({
            post_id, conteudo, parent_id: parent_id || null, aluno_id, autor
        }).returning('id');
        
        const newCommentId = (typeof commentIdResult === 'object') ? commentIdResult.id : commentIdResult;
        const newComment = await db('comentarios').where('id', newCommentId).first();
        res.status(201).json(newComment);
    } catch (err) {
        console.error("Erro ao criar comentário:", err);
        res.status(500).json({ message: "Erro ao criar comentário." });
    }
});

app.put('/api/comments/:id', checkCombinedAuthStatus, async (req, res) => {
    if (!req.aluno && !req.professor) {
        return res.status(401).json({ message: "Autenticação necessária para editar." });
    }

    const { id } = req.params;
    const { conteudo } = req.body;
    
    try {
        const comment = await db('comentarios').where({ id }).first();
        if (!comment) return res.status(404).json({ message: "Comentário não encontrado." });

        let isOwner = false;
        if (req.aluno) {
            isOwner = (comment.aluno_id === req.aluno.id);
        } else if (req.professor) {
            const professorName = `${req.professor.nome} (Professor)`;
            isOwner = (comment.autor === professorName);
        }

        if (!isOwner) {
            return res.status(403).json({ message: "Acesso negado. Você não pode editar este comentário." });
        }

        await db('comentarios').where({ id }).update({ conteudo, data_edicao: db.fn.now() });
        const updatedComment = await db('comentarios').where({ id }).first();
        res.json(updatedComment);

    } catch(err) {
        console.error("Erro ao editar comentário:", err);
        res.status(500).json({ message: "Erro ao editar comentário." });
    }
});

app.delete('/api/comments/:id', checkCombinedAuthStatus, async (req, res) => {
    const { id } = req.params;
    try {
        const comment = await db('comentarios').where({ id }).first();
        if (!comment) return res.status(404).json({ message: "Comentário não encontrado." });

        const isAuthor = req.aluno && comment.aluno_id === req.aluno.id;
        const isProfessor = !!req.professor;

        if (isAuthor || isProfessor) {
            await db('comentarios').where({ id }).del();
            return res.status(204).send();
        }
        res.status(403).json({ message: "Acesso negado." });
    } catch (err) {
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// API: DASHBOARD
app.get('/api/dashboard/recent-activity', authenticateProfessor, async (req, res) => {
    try {
        const limit = 5;

        const postsData = await db('posts').select('titulo as title', 'data_publicacao as date').orderBy('data_publicacao', 'desc').limit(limit);
        const posts = postsData.map(p => ({ ...p, type: 'post' }));

        const materiaisData = await db('materiais').select('titulo as title', 'data_upload as date').orderBy('data_upload', 'desc').limit(limit);
        const materiais = materiaisData.map(m => ({ ...m, type: 'material' }));

        const projetosData = await db('projetos').select('titulo as title', 'data_criacao as date').orderBy('data_criacao', 'desc').limit(limit);
        const projetos = projetosData.map(p => ({ ...p, type: 'projeto' }));

        const eventosData = await db('eventos').select('title', 'date').orderBy('date', 'desc').limit(limit);
        const eventos = eventosData.map(e => ({ ...e, type: 'evento' }));
        
        const allActivities = [...posts, ...materiais, ...projetos, ...eventos];
        allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentActivities = allActivities.slice(0, 4);
        
        res.json(recentActivities);
    } catch (err) {
        console.error("Erro ao buscar atividade recente:", err);
        res.status(500).json({ message: "Erro ao buscar atividades." });
    }
});

app.get('/api/dashboard/stats', authenticateProfessor, async (req, res) => {
    try {
        const posts = await db('posts').count('id as count').first();
        const projetos = await db('projetos').count('id as count').first();
        const eventos = await db('eventos').count('id as count').first();
        const materiais = await db('materiais').count('id as count').first();
        res.json({ 
            posts: posts.count, 
            projetos: projetos.count, 
            eventos: eventos.count, 
            materiais: materiais.count 
        });
    } catch (err) { 
        console.error("Erro ao buscar estatísticas:", err);
        res.status(500).json({ message: "Erro ao buscar estatísticas." }); 
    }
});

app.get('/api/dashboard/upcoming-events', authenticateProfessor, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = await db('eventos')
            .where('date', '>=', today)
            .orderBy('date', 'asc')
            .limit(4);
        res.json(upcomingEvents);
    } catch (err) { 
        console.error("Erro ao buscar próximos eventos:", err);
        res.status(500).json({ message: "Erro ao buscar próximos eventos." }); 
    }
});

// ===============================================
// ||         ROTAS DE PÁGINAS DO SITE          ||
// ===============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'site', 'index.html'));
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'login.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'cadastro.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'blog.html')));
app.get('/portfolio', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'portfolio.html')));
app.get('/materiais-de-aula', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'materiais.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'contato.html')));
app.get('/post', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'post.html')));
app.get('/portfolio-detalhe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'site', 'portfolio-detalhe.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.get('*', (req, res) => {
    res.redirect('/');
});
app.listen(PORT, () => { console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`); });