// ===============================================
// ||           PORTAL DO PROFESSOR             ||
// ||              SERVER.JS (FINAL)            ||
// ===============================================

// --- 1. IMPORTAÇÃO DOS MÓDULOS ---
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const db = require('./database/db'); // Conexão Knex com o banco de dados
const multer = require('multer');   // Middleware para upload de arquivos
const bcrypt = require('bcrypt');

// --- 2. VERIFICAÇÃO INICIAL DO BANCO DE DADOS ---
const dbPath = path.resolve(__dirname, 'database/portal.db');
if (!fs.existsSync(dbPath)) {
    console.error("\n[ERRO CRÍTICO] O arquivo de banco de dados 'portal.db' não foi encontrado!");
    console.error("Execute o comando 'npm run db:setup' para criar e configurar o banco de dados antes de iniciar o servidor.\n");
    process.exit(1); // Encerra o processo se o DB não existir
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

    // Validação básica
    if (!nome || !email || !senha) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Verificar se o e-mail já existe
        const alunoExistente = await db('alunos').where({ email }).first();
        if (alunoExistente) {
            return res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado.' });
        }

        // Criptografar a senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Inserir o novo aluno no banco de dados
        const [id] = await db('alunos').insert({
            nome,
            email,
            senha: senhaHash
        }).returning('id');

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
        // Procurar o aluno pelo e-mail
        const aluno = await db('alunos').where({ email }).first();

        // Se o aluno não for encontrado, ou a senha estiver errada
        if (!aluno) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        // Comparar a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, aluno.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        // Login bem-sucedido 
        res.json({
            success: true,
            message: 'Login bem-sucedido!',
            aluno: { //OBJETO ADICIONADO
                id: aluno.id,
                nome: aluno.nome,
                email: aluno.email
            }
        });

    } catch (err) {
        console.error("Erro no login do aluno:", err);
        res.status(500).json({ success: false, message: 'Erro interno no servidor. Tente novamente.' });
    }
});

// API: LOGIN
app.post('/api/auth/login', (req, res) => {
    if (req.body.email === 'professor@email.com' && req.body.senha === '123') {
        res.json({ success: true, token: 'fake-jwt-token-for-final-test' });
    } else {
        res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
    }
});

// API: PERFIL
app.get('/api/profile', async (req, res) => {
    try {
        const profile = await db('perfil').first();
        if (profile) res.json(profile);
        else res.status(404).json({ message: "Perfil não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao buscar perfil." }); }
});
app.put('/api/profile', async (req, res) => {
    try {
        delete req.body.imagem_url;
        const count = await db('perfil').where('id', 1).update(req.body);
        if (count > 0) res.json(await db('perfil').where('id', 1).first());
        else res.status(404).json({ message: "Perfil não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao salvar perfil." }); }
});
app.post('/api/profile/picture', imageUpload.single('profilePicture'), async (req, res) => {
    if (!req.file) { return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' }); }
    try {
        const currentProfile = await db('perfil').where('id', 1).first();
        if (currentProfile && currentProfile.imagem_url) {
            const oldImagePath = path.join(__dirname, 'public', currentProfile.imagem_url);
            if (!currentProfile.imagem_url.includes('default-avatar.png') && fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        const imagem_url = `/uploads/images/${req.file.filename}`;
        await db('perfil').where('id', 1).update({ imagem_url });
        const updatedProfile = await db('perfil').where('id', 1).first();
        res.json(updatedProfile);
    } catch (err) { console.error("ERRO DETALHADO ao fazer upload da foto de perfil:", err); res.status(500).json({ message: `Erro interno ao processar a imagem: ${err.message}` }); }
});

// API: MATERIAIS
app.get('/api/materiais', async (req, res) => {
    try {
        const materiais = await db('materiais').select('*').orderBy('data_upload', 'desc');
        res.json(materiais);
    } catch (err) { res.status(500).json({ message: "Erro ao buscar materiais." }); }
});

app.post('/api/materiais', materialUpload.single('materialFile'), async (req, res) => {
    try {
        const { titulo, descricao, categoria, link_externo } = req.body;
        let materialData = { titulo, descricao, categoria, link_externo };

        if (req.file) {
            materialData = {
                ...materialData,
                nome_arquivo: req.file.originalname,
                caminho_arquivo: `/${path.relative('public', req.file.path).replace(/\\/g, "/")}`,
                tipo_arquivo: req.file.mimetype,
                tamanho_arquivo: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
            };
        } else if (!link_externo) {
            return res.status(400).json({ message: "É necessário enviar um arquivo ou um link externo." });
        }
        
        const [id] = await db('materiais').insert(materialData).returning('id');
        const newId = typeof id === 'object' ? id[Object.keys(id)[0]] : id;
        const newMaterial = await db('materiais').where({ id: newId }).first();
        res.status(201).json(newMaterial);

    } catch (err) {
        console.error("Erro ao adicionar material:", err);
        res.status(500).json({ message: "Erro ao salvar material." });
    }
});

app.delete('/api/materiais/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const material = await db('materiais').where({ id }).first();

        if (!material) {
            return res.status(404).json({ message: "Material não encontrado." });
        }

        if (material.caminho_arquivo) {
            const filePath = path.join(__dirname, 'public', material.caminho_arquivo);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
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
app.post('/api/projetos', async (req, res) => {
  try {
    const [id] = await db('projetos').insert(req.body).returning('id');
    const newId = typeof id === 'object' ? id[Object.keys(id)[0]] : id;
    res.status(201).json(await db('projetos').where({ id: newId }).first());
  } catch (err) { res.status(500).json({ message: "Erro ao adicionar projeto." }); }
});
app.delete('/api/projetos/:id', async (req, res) => {
  try {
    const count = await db('projetos').where('id', req.params.id).del();
    if (count > 0) res.status(204).send();
    else res.status(404).json({ message: "Projeto não encontrado." });
  } catch (err) { res.status(500).json({ message: "Erro ao apagar projeto." }); }
});

// API: EVENTOS (Agenda)
app.get('/api/eventos', async (req, res) => {
    try { res.json(await db('eventos').select('*').orderBy('date', 'asc')); } catch (err) { res.status(500).json({ message: "Erro ao buscar eventos." }); }
});
app.post('/api/eventos', async (req, res) => {
    try {
        const [id] = await db('eventos').insert(req.body).returning('id');
        const newId = typeof id === 'object' ? id[Object.keys(id)[0]] : id;
        res.status(201).json(await db('eventos').where({ id: newId }).first());
    } catch (err) { res.status(500).json({ message: "Erro ao adicionar evento." }); }
});
app.delete('/api/eventos/:id', async (req, res) => {
    try {
        const count = await db('eventos').where('id', req.params.id).del();
        if (count > 0) res.status(204).send(); else res.status(404).json({ message: "Evento não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao apagar evento." }); }
});

// API: POSTS (Blog)
app.get('/api/posts', async (req, res) => {
    try { res.json(await db('posts').select('*').orderBy('data_publicacao', 'desc')); } catch (err) { res.status(500).json({ message: "Erro ao buscar posts." }); }
});
app.post('/api/posts', imageUpload.single('imagem'), async (req, res) => {
    try {
        const { titulo, conteudo, categoria, external_url } = req.body;
        const imagem_url = req.file ? `/${path.relative('public', req.file.path).replace(/\\/g, "/")}` : null;
        const postData = { titulo, conteudo, categoria, imagem_url, external_url, data_publicacao: new Date().toISOString() };  
        const [id] = await db('posts').insert(postData).returning('id');
        const newId = typeof id === 'object' ? id[Object.keys(id)[0]] : id;
        res.status(201).json(await db('posts').where({ id: newId }).first());
    } catch (err) { res.status(500).json({ message: "Erro ao salvar post." }); }
});
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const post = await db('posts').where({ id: req.params.id }).first();
        if (post && post.imagem_url) { const imagePath = path.join(__dirname, 'public', post.imagem_url); if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); }
        const count = await db('posts').where({ id: req.params.id }).del();
        if (count > 0) res.status(204).send(); else res.status(404).json({ message: "Post não encontrado." });
    } catch (err) { res.status(500).json({ message: "Erro ao apagar post." }); }
});

// =======================================================
// ||           COLE ESTE CÓDIGO NO SEU SERVER.JS         ||
// =======================================================

// API: PEGAR UM POST ESPECÍFICO PELO ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db('posts').where({ id }).first(); // .first() pega o primeiro resultado

        if (post) {
            res.json(post);
        } else {
            // Se o post com esse ID não for encontrado, retorne 404
            res.status(404).json({ message: "Post não encontrado." });
        }
    } catch (err) {
        console.error("Erro ao buscar post por ID:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});

// API: PEGAR E ENVIAR COMENTÁRIOS DE UM POST
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await db('comentarios').where({ post_id: id }).orderBy('data_publicacao', 'asc');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar comentários." });
    }
});

app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { autor, conteudo } = req.body; // Aceita 'autor' se for enviado

        if (!conteudo) {
            return res.status(400).json({ message: "O conteúdo do comentário é obrigatório." });
        }

        const newComment = {
            post_id: id,
            conteudo: conteudo,
            autor: autor || 'Anônimo' // Usa 'Anônimo' se nenhum autor for fornecido
        };

        const [commentId] = await db('comentarios').insert(newComment).returning('id');
        const newId = typeof commentId === 'object' ? commentId[Object.keys(commentId)[0]] : commentId;
        const result = await db('comentarios').where({ id: newId }).first();
        res.status(201).json(result);

    } catch (err) {
        console.error("Erro ao adicionar comentário:", err);
        res.status(500).json({ message: "Erro ao salvar comentário." });
    }
});

// API: DASHBOARD
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const posts = await db('posts').count('id as count').first();
        const projetos = await db('projetos').count('id as count').first();
        const eventos = await db('eventos').count('id as count').first();
        const materiais = await db('materiais').count('id as count').first();
        res.json({ posts: posts.count, projetos: projetos.count, eventos: eventos.count, materiais: materiais.count });
    } catch (err) { res.status(500).json({ message: "Erro ao buscar estatísticas." }); }
});
app.get('/api/dashboard/upcoming-events', async (req, res) => {
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

// NOVA ROTA PARA O DETALHE DO POST
app.get('/post', (req, res) => res.sendFile(path.join(__dirname, 'public', 'site', 'post.html')));

// ROTA PARA O PAINEL DE ADMIN
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Middleware para servir as páginas do admin
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));


// ROTA CATCH-ALL (deve ser a última)
// Redireciona qualquer rota não encontrada para a página inicial pública
app.get('*', (req, res) => {
    res.redirect('/');
});


// INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => { console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`); });