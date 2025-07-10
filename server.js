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
const jwt = require('jsonwebtoken'); // <-- IMPORTE O JWT AQUI
const authenticateProfessor = require('./middleware/authenticateProfessor');
const JWT_SECRET = 'R!d1sRIbeir0';
const authenticateAluno = require('./middleware/authenticateAluno');
const JWT_SECRET_ALUNO = 'R!d1sRIbeir0!';

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
        const token = jwt.sign(
            { id: aluno.id, nome: aluno.nome, email: aluno.email, role: 'aluno' },
            JWT_SECRET_ALUNO, // Use a chave secreta do aluno
            { expiresIn: '8h' }
        );

        // 2. Envie o token na resposta
        res.json({
            success: true,
            message: 'Login bem-sucedido!',
            token: token, // Envie o token
            aluno: {      // Você pode continuar enviando o objeto 'aluno' para compatibilidade
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
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }

    try {
        const professor = await db('perfil').where({ email }).first();

        // Se não encontrou o professor, retorna erro
        if (!professor) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        // Compara a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, professor.senha);

        // Se a senha estiver incorreta, retorna erro
        if (!senhaCorreta) {
            return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { id: professor.id, role: 'professor' }, 
            JWT_SECRET,
            { expiresIn: '8h' }                       // Tempo de expiração do token
        );

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
        // Garante que um professor só possa editar o seu próprio perfil
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
        // Garante que a foto seja atualizada no perfil do professor logado
        await db('perfil').where('id', req.professor.id).update({ imagem_url });
        const updatedProfile = await db('perfil').where('id', req.professor.id).first();
        res.json(updatedProfile);
    } catch (err) {
    console.error("ERRO DETALHADO ao fazer upload da foto de perfil:", err); res.status(500).json({ message: `Erro interno ao processar a imagem: ${err.message}` }); }
});

// API: MENSAGENS
// Rota para o ALUNO enviar uma mensagem (protegida)
app.post('/api/mensagens', authenticateAluno, async (req, res) => {
    const { assunto, corpo } = req.body;
    const { id, nome, email } = req.aluno; // Dados do token

    if (!assunto || !corpo) {
        return res.status(400).json({ message: "Assunto e corpo da mensagem são obrigatórios." });
    }

    try {
        const novaMensagem = {
            aluno_id: id,
            remetente_nome: nome,
            remetente_email: email,
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

// Rota para o PROFESSOR buscar todas as mensagens (protegida)
app.get('/api/mensagens', authenticateProfessor, async (req, res) => {
    try {
        const mensagens = await db('mensagens').select('*').orderBy('data_envio', 'desc');
        res.json(mensagens);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar mensagens." });
    }
});

// Rota para o PROFESSOR marcar uma mensagem como lida (protegida)
app.put('/api/mensagens/:id/read', authenticateProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        await db('mensagens').where({ id }).update({ lida: true });
        res.status(200).json({ success: true, message: 'Mensagem marcada como lida.' });
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar mensagem." });
    }
});

// Rota para o PROFESSOR apagar uma mensagem (protegida)
app.delete('/api/mensagens/:id', authenticateProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const count = await db('mensagens').where({ id }).del();
        if (count > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Mensagem não encontrada." });
        }
    } catch (err) {
        res.status(500).json({ message: "Erro ao apagar mensagem." });
    }
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
        const postData = { titulo, conteudo, categoria, imagem_url, external_url: new Date().toISOString() };  
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
app.get('/api/dashboard/recent-activity', async (req, res) => {
    try {
        const limit = 5; // Quantidade de itens a buscar por tabela

        // 1. Busca os itens mais recentes de cada tabela, já padronizando os campos
        const posts = await db('posts')
            .select('titulo as title', 'data_publicacao as date', db.raw("'post' as type"))
            .orderBy('data_publicacao', 'desc')
            .limit(limit);

        const materiais = await db('materiais')
            .select('titulo as title', 'data_upload as date', db.raw("'material' as type"))
            .orderBy('data_upload', 'desc')
            .limit(limit);

        const projetos = await db('projetos')
            .select('titulo as title', 'data_criacao as date', db.raw("'projeto' as type"))
            .orderBy('data_criacao', 'desc')
            .limit(limit);

        const eventos = await db('eventos')
            .select('title as title', 'date as date', db.raw("'evento' as type"))
            .orderBy('date', 'desc')
            .limit(limit);
        
        // 2. Junta todos os resultados em um único array
        const allActivities = [...posts, ...materiais, ...projetos, ...eventos];

        // 3. Ordena o array combinado pela data, do mais recente para o mais antigo
        allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Pega apenas os 4 itens mais recentes do resultado final
        const recentActivities = allActivities.slice(0, 4);

        res.json(recentActivities);

    } catch (err) {
        console.error("Erro ao buscar atividade recente:", err);
        res.status(500).json({ message: "Erro ao buscar atividades." });
    }
});

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