// database/setup.js
const db = require('./db');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  console.log('Iniciando a configuração completa do banco de dados...');

  try {
    // Apaga as tabelas na ordem correta para evitar erros de chave estrangeira
    await db.schema.dropTableIfExists('comentarios');
    await db.schema.dropTableIfExists('portfolio_media');
    await db.schema.dropTableIfExists('projetos');
    await db.schema.dropTableIfExists('eventos');
    await db.schema.dropTableIfExists('materiais');
    await db.schema.dropTableIfExists('mensagens');
    await db.schema.dropTableIfExists('perfil_links');
    await db.schema.dropTableIfExists('posts');
    await db.schema.dropTableIfExists('alunos');
    await db.schema.dropTableIfExists('perfil');
    await db.schema.dropTableIfExists('sobre_conteudo');

    // Criação da tabela de Alunos
    await db.schema.createTable('alunos', table => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('email').notNullable().unique();
      table.string('senha').notNullable();
      table.string('imagem_url');
      table.timestamp('data_cadastro').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "alunos" criada.');

    // Criação da tabela de Posts
    await db.schema.createTable('posts', table => {
      table.increments('id').primary();
      table.string('titulo').notNullable();
      table.text('conteudo');
      table.string('categoria');
      table.string('imagem_url');
      table.string('external_url');
      table.timestamp('data_publicacao').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "posts" criada.');

    // === TABELA DE COMENTÁRIOS ATUALIZADA ===
    await db.schema.createTable('comentarios', table => {
        table.increments('id').primary();
        table.integer('post_id').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE');
        table.integer('aluno_id').unsigned().references('id').inTable('alunos').onDelete('SET NULL');
        // Adiciona a referência para respostas (comentário pai)
        table.integer('parent_id').unsigned().references('id').inTable('comentarios').onDelete('CASCADE');
        table.string('autor').notNullable();
        table.text('conteudo').notNullable();
        table.timestamp('data_publicacao').defaultTo(db.fn.now());
        // Adiciona campo para registrar edições
        table.timestamp('data_edicao');
    });
    console.log('✅ Tabela "comentarios" atualizada com suporte a respostas e edições.');

    // Criação da tabela de Perfil do Professor
    await db.schema.createTable('perfil', table => { 
        table.increments('id').primary(); 
        table.string('nome'); 
        table.string('cargo'); 
        table.string('email').notNullable().unique(); 
        table.string('senha').notNullable(); 
        table.text('biografia'); 
        table.string('imagem_url'); 
        table.string('linkedin_url'); 
        table.string('github_url'); 
        table.string('instagram_url');
        table.string('website_url'); 
    });
    const salt = await bcrypt.genSalt(10);
    const senhaHashProfessor = await bcrypt.hash('123', salt);
    await db('perfil').insert({ id: 1, nome: 'Ridis Pereira Ribeiro', cargo: 'Professor', email: 'professor@email.com', senha: senhaHashProfessor, imagem_url: '/uploads/images/default-avatar.png' });
    console.log('✅ Tabela "perfil" criada e populada.');
    
    // O restante das tabelas...
    await db.schema.createTable('perfil_links', table => {
      table.increments('id').primary();
      table.integer('perfil_id').unsigned().notNullable().references('id').inTable('perfil').onDelete('CASCADE');
      table.string('label').notNullable();
      table.string('url').notNullable();
    });
    console.log('✅ Tabela "perfil_links" criada.');
    
    await db.schema.createTable('materiais', table => {
        table.increments('id').primary();
        table.string('titulo').notNullable();
        table.text('descricao');
        table.string('categoria').notNullable();
        table.string('imagem_capa_url');
        table.string('nome_arquivo');
        table.string('caminho_arquivo');
        table.string('tipo_arquivo');
        table.string('tamanho_arquivo');
        table.string('link_externo');
        table.timestamp('data_upload').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "materiais" criada.');

    await db.schema.createTable('mensagens', table => {
        table.increments('id').primary();
        table.integer('aluno_id').unsigned().notNullable().references('id').inTable('alunos').onDelete('CASCADE');
        table.string('remetente_nome').notNullable();
        table.string('remetente_email').notNullable();
        table.string('assunto').notNullable();
        table.text('corpo').notNullable();
        table.timestamp('data_envio').defaultTo(db.fn.now());
        table.boolean('lida').defaultTo(false);
    });
    console.log('✅ Tabela "mensagens" criada.');

    await db.schema.createTable('projetos', table => {
        table.increments('id').primary();
        table.string('titulo').notNullable();
        table.text('descricao').notNullable();
        table.string('imagem_capa_url');
        table.string('categoria').notNullable();
        table.string('status').notNullable();
        table.string('periodo').notNullable();
        table.string('tags');
        table.string('link_externo');
        table.timestamp('data_criacao').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "projetos" criada.');
    
    await db.schema.createTable('portfolio_media', table => {
        table.increments('id').primary();
        table.string('caminho_arquivo').notNullable();
        table.string('tipo_midia').notNullable(); 
        table.integer('projeto_id').unsigned().notNullable().references('id').inTable('projetos').onDelete('CASCADE');
    });
    console.log('✅ Tabela "portfolio_media" criada.');
    
    await db.schema.createTable('eventos', table => { 
        table.increments('id').primary(); 
        table.string('title').notNullable(); 
        table.string('date').notNullable();
        table.string('time');
        table.string('type').notNullable();
        table.string('cor').defaultTo('#0d6efd');
        table.text('observacao');
    });
    console.log('✅ Tabela "eventos" criada.');

    await db.schema.createTable('sobre_conteudo', table => {
        table.string('secao').primary();
        table.text('conteudo').defaultTo('');
    });
    console.log('✅ Tabela "sobre_conteudo" criada.');

    console.log('\n🎉 Configuração do banco de dados concluída com sucesso!');
  } catch (err) {
    console.error("❌ Erro ao configurar a base de dados:", err);
  } finally {
    db.destroy();
  }
}

setupDatabase();