const jwt = require('jsonwebtoken');
const JWT_SECRET = 'R!d1sRIbeir0'; // Use a mesma chave secreta do server.js

function authenticateProfessor(req, res, next) {
    // Pega o token do cabeçalho da requisição
    const token = req.header('x-auth-token');

    // Se não houver token, nega o acesso
    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        // Tenta verificar e decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Adiciona os dados do professor (que estavam no token) ao objeto da requisição
        req.professor = decoded; 
        
        // Passa para a próxima função (a lógica da rota)
        next(); 
    } catch (ex) {
        // Se o token for inválido, nega o acesso
        res.status(400).json({ message: 'Token inválido.' });
    }
}

module.exports = authenticateProfessor;