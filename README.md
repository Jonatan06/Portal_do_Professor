# Portal do Professor 🎓

![Capa do Projeto](https://raw.githubusercontent.com/jonatan06/Portal_do_Professor/main/docs/images/dashboard-screenshot.png)

<p align="center">
  Um portal acadêmico completo para gestão de conteúdo por parte do professor e acesso facilitado para os alunos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status do Projeto">
  <img src="https://img.shields.io/badge/node.js-18.x-green" alt="Node.js">
  <img src="https://img.shields.io/badge/backend-Express.js-blue" alt="Backend com Express.js">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

---

## 🚀 Sobre o Projeto

O **Portal do Professor** é uma aplicação web Full-Stack projetada para centralizar a comunicação e a distribuição de materiais entre professores e alunos. A plataforma permite que o professor gerencie seu perfil, blog, materiais de aula, portfólio de projetos e agenda, enquanto os alunos podem se cadastrar, fazer login e consumir todo o conteúdo disponibilizado.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

* **Backend:** Node.js, Express.js
* **Banco de Dados:** SQLite com Knex.js
* **Autenticação:** JWT (JSON Web Tokens) e Bcrypt
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)

---

## ✨ Funcionalidades Principais

-   **Painel do Professor (Área Administrativa):**
    - [x] Autenticação segura de professor.
    - [x] Dashboard com estatísticas gerais.
    - [x] Gerenciamento de Perfil (CRUD).
    - [x] Gerenciamento de Blog (CRUD de posts).
    - [x] Upload e gerenciamento de Materiais de aula.
    - [x] Gestão de Portfólio de projetos.
    - [x] Agenda interativa para eventos.
-   **Portal Público (Área do Aluno):**
    - [x] Cadastro e Login de alunos.
    - [x] Visualização de posts do Blog, com sistema de comentários.
    - [x] Acesso e download dos materiais de aula.
    - [x] Visualização do portfólio de projetos do professor.
    - [x] Página de Contato integrada com a autenticação do aluno.

---

## ⚙️ Como Executar o Projeto Localmente

Siga os passos abaixo para ter uma cópia do projeto rodando na sua máquina.

```bash
# 1. Clone este repositório
$ git clone [https://github.com/jonatan06/Portal_do_Professor.git](https://github.com/jonatan06/Portal_do_Professor.git)

# 2. Navegue até o diretório do projeto
$ cd Portal_do_Professor

# 3. Instale as dependências do projeto
$ npm install

# 4. Crie e popule o banco de dados
# (Este comando só precisa ser executado uma vez)
$ npm run db:setup

# 5. Inicie o servidor em modo de desenvolvimento
$ npm run dev

# O servidor estará rodando em http://localhost:3001
```

---

## 👥 Autores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Jonatan06">
        <img src="https://github.com/Jonatan06.png?size=115" width="115px;" alt="Foto do Jonatan no GitHub"/><br>
        <sub>
          <b>Jonatan06</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Mariajuliasants">
        <img src="https://github.com/Mariajuliasants.png?size=115" width="115px;" alt="Foto da Maria Júlia Santos no GitHub"/><br>
        <sub>
          <b>Maria Júlia Santos</b>
        </sub>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://github.com/matheusarruda001">
        <img src="https://github.com/matheusarruda001.png?size=115" width="115px;" alt="Foto do Matheus Arruda no GitHub"/><br>
        <sub>
          <b>Matheus Arruda</b>
        </sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/matheus0liveir4">
        <img src="https://github.com/matheus0liveir4.png?size=115" width="115px;" alt="Foto do Matheus de Oliveira no GitHub"/><br>
        <sub>
          <b>Matheus de Oliveira</b>
        </sub>
      </a>
    </td>
  </tr>
</table>

<br>
Projeto desenvolvido como parte de um trabalho acadêmico da faculdade.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE.md) para mais detalhes.
