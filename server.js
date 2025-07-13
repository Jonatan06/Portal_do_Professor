// ===============================================
// ||           PORTAL DO PROFESSOR             ||
// ||         SERVER.JS (VERSÃO FINAL)          ||
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
            const uploadPath = path.join('public', destination);
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
    { name: 'materialFile', maxCount: 1 }
]);


// --- 4. INICIALIZAÇÃO DO EXPRESS ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 5. MIDDLEWARES GLOBAIS ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// ===============================================
// ||              ROTAS DA API                 ||
// ===============================================

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

// ROTA DE LOGIN DE ALUNO
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
            { id: aluno.id, nome: aluno.nome, email: aluno.email, role: 'aluno' },
            JWT_SECRET_ALUNO,
            { expiresIn: '8h' }
        );
        res.json({
            success: true,
            message: 'Login bem-sucedido!',
            token: token,
            aluno: { id: aluno.id, nome: aluno.nome, email: aluno.email }
        });
    } catch (err) {
        console.error("Erro no login do aluno:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor. Tente novamente.' });
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
        const token = jwt.sign({ id: professor.id, role: 'professor' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token: token });
    } catch (err) {
        console.error("Erro no login do professor:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

// API: PERFIL
app.get('/api/profile', authenticateProfessor, async (req, res) => {
    try {
        const profile = await db('perfil').where({ id: req.professor.id }).first();
        if (profile) res.json(profile);
        else res.status(404).json({ message: "Perfil não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao buscar perfil." }); }
});

app.put('/api/profile', authenticateProfessor, async (req, res) => {
    try {
        delete req.body.imagem_url;
        const count = await db('perfil').where('id', req.professor.id).update(req.body);
        if (count > 0) {
            const updatedProfile = await db('perfil').where('id', req.professor.id).first();
            res.json(updatedProfile);
        } else {
            res.status(404).json({ message: "Perfil não encontrado." });
        }
    } catch (err) { res.status(500).json({ message: "Erro ao salvar perfil." }); }
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

app.get('/api/public-profile', async (req, res) => {
    try {
        const profile = await db('perfil').where({ id: 1 }).first();
        if (profile) {
            delete profile.senha;
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
app.post('/api/mensagens', authenticateAluno, async (req, res) => {
    const { assunto, corpo } = req.body;
    const { id, nome, email } = req.aluno;
    if (!assunto || !corpo) {
        return res.status(400).json({ message: "Assunto e corpo da mensagem são obrigatórios." });
    }
    try {
        const novaMensagem = { aluno_id: id, remetente_nome: nome, remetente_email: email, assunto, corpo };
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
        res.json(materiais);
    } catch (err) { res.status(500).json({ message: "Erro ao buscar materiais." }); }
});

app.post('/api/materiais', authenticateProfessor, materialFormHandler, async (req, res) => {
    try {
        const { titulo, descricao, categoria, link_externo } = req.body;
        const materialData = { titulo, descricao, categoria, link_externo };

        if (req.files.imagem_capa) {
            materialData.imagem_capa_url = `/${path.relative('public', req.files.imagem_capa[0].path).replace(/\\/g, "/")}`;
        }
        if (req.files.materialFile) {
            const materialFile = req.files.materialFile[0];
            materialData.nome_arquivo = materialFile.originalname;
            materialData.caminho_arquivo = `/${path.relative('public', materialFile.path).replace(/\\/g, "/")}`;
            materialData.tipo_arquivo = materialFile.mimetype;
            materialData.tamanho_arquivo = `${(materialFile.size / 1024 / 1024).toFixed(2)} MB`;
        }
        
        if (!materialData.caminho_arquivo && !materialData.link_externo) {
            return res.status(400).json({ message: "É necessário enviar um arquivo ou um link externo." });
        }

        const [id] = await db('materiais').insert(materialData).returning('id');
        const newId = typeof id === 'object' ? id.id : id;
        const newMaterial = await db('materiais').where({ id: newId }).first();
        res.status(201).json(newMaterial);
    } catch (err) {
        console.error("Erro ao adicionar material:", err);
        res.status(500).json({ message: "Erro ao salvar material." });
    }
});

// ROTA PUT PARA EDITAR MATERIAIS
app.put('/api/materiais/:id', authenticateProfessor, materialFormHandler, async (req, res) => {
    const { id } = req.params;
    try {
        const { titulo, descricao, categoria, link_externo } = req.body;
        const updateData = { titulo, descricao, categoria, link_externo };

        if (req.files.imagem_capa) {
            updateData.imagem_capa_url = `/${path.relative('public', req.files.imagem_capa[0].path).replace(/\\/g, "/")}`;
        }
        if (req.files.materialFile) {
            const materialFile = req.files.materialFile[0];
            updateData.nome_arquivo = materialFile.originalname;
            updateData.caminho_arquivo = `/${path.relative('public', materialFile.path).replace(/\\/g, "/")}`;
            updateData.tipo_arquivo = materialFile.mimetype;
            updateData.tamanho_arquivo = `${(materialFile.size / 1024 / 1024).toFixed(2)} MB`;
        }
        
        const count = await db('materiais').where({ id }).update(updateData);
        if (count > 0) {
            const updatedMaterial = await db('materiais').where({ id }).first();
            res.status(200).json(updatedMaterial);
        } else {
            res.status(404).json({ message: "Material não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao editar material:", err);
        res.status(500).json({ message: "Erro ao editar material." });
    }
});

app.delete('/api/materiais/:id', authenticateProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const material = await db('materiais').where({ id }).first();
        if (!material) return res.status(404).json({ message: "Material não encontrado." });
        
        if (material.imagem_capa_url) {
            const capaPath = path.join(__dirname, 'public', material.imagem_capa_url);
            if (fs.existsSync(capaPath)) fs.unlinkSync(capaPath);
        }
        if (material.caminho_arquivo) {
            const filePath = path.join(__dirname, 'public', material.caminho_arquivo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await db('materiais').where({ id }).del();
        res.status(204).send();
    } catch (err) {
        console.error("Erro ao apagar material:", err);
        res.status(500).json({ message: "Erro ao apagar material." });
    }
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
            capaUrl = `/${path.relative('public', req.files.imagem_capa[0].path).replace(/\\/g, "/")}`;
        }

        const [projetoResult] = await trx('projetos').insert({
            titulo, descricao, categoria, status, periodo, tags, link_externo,
            imagem_capa_url: capaUrl
        }).returning('id');

        const projetoId = typeof projetoResult === 'object' ? projetoResult.id : projetoResult;
        
        if (req.files && req.files.fotos) {
            const medias = req.files.fotos.map(file => ({
                caminho_arquivo: `/${path.relative('public', file.path).replace(/\\/g, "/")}`,
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
            updateData.imagem_capa_url = `/${path.relative('public', req.files.imagem_capa[0].path).replace(/\\/g, "/")}`;
        }

        await trx('projetos').where({ id }).update(updateData);
        
        if (req.files && req.files.fotos) {
            const medias = req.files.fotos.map(file => ({
                caminho_arquivo: `/${path.relative('public', file.path).replace(/\\/g, "/")}`,
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

app.delete('/api/projetos/:id', async (req, res) => {
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
        const imagem_url = req.file ? `/${path.relative('public', req.file.path).replace(/\\/g, "/")}` : null;
        const postData = { titulo, conteudo, categoria, imagem_url, external_url };
        const [id] = await db('posts').insert(postData).returning('id');
        const newId = typeof id === 'object' ? id.id : id;
        res.status(201).json(await db('posts').where({ id: newId }).first());
    } catch (err) { res.status(500).json({ message: "Erro ao salvar post." }); }
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
        const comments = await db('comentarios').where({ post_id: req.params.id }).orderBy('data_publicacao', 'asc');
        res.json(comments);
    } catch (err) { res.status(500).json({ message: "Erro ao buscar comentários." }); }
});

app.post('/api/posts/:id/comments', authenticateAluno, async (req, res) => {
    try {
        const { autor, conteudo } = req.body;
        if (!conteudo) return res.status(400).json({ message: "O conteúdo do comentário é obrigatório." });
        const newComment = { post_id: req.params.id, conteudo: conteudo, autor: autor || 'Anônimo' };
        const [commentId] = await db('comentarios').insert(newComment).returning('id');
        const newId = typeof commentId === 'object' ? commentId.id : commentId;
        const result = await db('comentarios').where({ id: newId }).first();
        res.status(201).json(result);
    } catch (err) {
        console.error("Erro ao adicionar comentário:", err);
        res.status(500).json({ message: "Erro ao salvar comentário." });
    }
});

// API: DASHBOARD
app.get('/api/dashboard/recent-activity', authenticateProfessor, async (req, res) => {
    try {
        const limit = 5;
        const posts = await db('posts').select('titulo as title', 'data_publicacao as date', db.raw("'post' as type")).orderBy('data_publicacao', 'desc').limit(limit);
        const materiais = await db('materiais').select('titulo as title', 'data_upload as date', db.raw("'material' as type")).orderBy('data_upload', 'desc').limit(limit);
        const projetos = await db('projetos').select('titulo as title', 'data_criacao as date', db.raw("'projeto' as type")).orderBy('data_criacao', 'desc').limit(limit);
        const eventos = await db('eventos').select('title as title', 'date as date', db.raw("'evento' as type")).orderBy('date', 'desc').limit(limit);
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
        res.json({ posts: posts.count, projetos: projetos.count, eventos: eventos.count, materiais: materiais.count });
    } catch (err) { res.status(500).json({ message: "Erro ao buscar estatísticas." }); }
});

app.get('/api/dashboard/upcoming-events', authenticateProfessor, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const upcomingEvents = await db('eventos').where('date', '>=', today).orderBy('date', 'asc').limit(4);
        res.json(upcomingEvents);
    } catch (err) { res.status(500).json({ message: "Erro ao buscar próximos eventos." }); }
});


// ===============================================
// ||         ROTAS DE PÁGINAS DO SITE          ||
// ===============================================

// ROTA PRINCIPAL - Site Público para Alunos/Visitantes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'site', 'index.html'));
});

// Outras páginas públicas
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'login.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'cadastro.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'blog.html')));
app.get('/portfolio', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'portfolio.html')));
app.get('/materiais-de-aula', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'materiais.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'contato.html')));

// ROTA PARA DETALHES
app.get('/post', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'post.html')));
app.get('/portfolio-detalhe', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'site', 'portfolio-detalhe.html'));
});

// ROTA PARA O PAINEL DE ADMIN
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// ROTA CATCH-ALL (deve ser a última)
app.get('*', (req, res) => {
    res.redirect('/');
});

// INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => { console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`); });