const jwt = require('jsonwebtoken');
const JWT_SECRET_ALUNO = 'R!d1sRIbeir0!'; // Use uma chave diferente para alunos!

function authenticateAluno(req, res, next) {
    const token = req.header('x-auth-token');
    
    // ADICIONE ESTA LINHA DE VERIFICAÇÃO AQUI
    console.log('VERIFICAÇÃO: Chave usada para verificar o token:', JWT_SECRET_ALUNO);

    if (!token) return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET_ALUNO);
        req.aluno = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Token inválido.' });
    }
}
module.exports = authenticateAluno;