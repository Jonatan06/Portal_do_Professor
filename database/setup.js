const db = require('./db');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  console.log('Iniciando a configuração completa do banco de dados...');

  try {
    // --- Tabela de Alunos ---
    await db.schema.dropTableIfExists('alunos');
    await db.schema.createTable('alunos', table => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.string('email').notNullable().unique();
      table.string('senha').notNullable();
      table.timestamp('data_cadastro').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "alunos" criada com sucesso.');
    
    // --- Tabelas de Posts e Comentários (Blog) ---
    await db.schema.dropTableIfExists('comentarios');
    await db.schema.dropTableIfExists('posts');
    await db.schema.createTable('posts', table => {
      table.increments('id').primary();
      table.string('titulo').notNullable();
      table.text('conteudo');
      table.string('categoria');
      table.string('imagem_url');
      table.string('external_url');
      table.timestamp('data_publicacao').defaultTo(db.fn.now());
    });
    await db('posts').insert([
        { id: 1, titulo: 'O que torna a interface do Nubank tão intuitiva?', conteudo: 'Uma análise aprofundada dos princípios de design e da psicologia do usuário que fazem do aplicativo do Nubank uma referência em usabilidade.', categoria: 'Estudo de Caso' }
    ]);
    console.log('✅ Tabela "posts" criada e populada com sucesso.');

    await db.schema.createTable('comentarios', table => {
        table.increments('id').primary();
        table.string('autor').notNullable().defaultTo('Anônimo');
        table.text('conteudo').notNullable();
        table.timestamp('data_publicacao').defaultTo(db.fn.now());
        table.integer('post_id').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE');
    });
    await db('comentarios').insert([
        { autor: 'Maria Silva', conteudo: 'Ótima análise! Realmente a simplicidade do Nubank é o que mais me atrai.', post_id: 1 }
    ]);
    console.log('✅ Tabela "comentarios" criada e populada com sucesso.');
    
    // --- Tabela de Materiais ---
    await db.schema.dropTableIfExists('materiais');
    await db.schema.createTable('materiais', table => {
        table.increments('id').primary();
        table.string('titulo').notNullable();
        table.text('descricao');
        table.string('categoria').notNullable();
        table.string('nome_arquivo');
        table.string('caminho_arquivo');
        table.string('tipo_arquivo');
        table.string('tamanho_arquivo');
        table.string('link_externo');
        table.timestamp('data_upload').defaultTo(db.fn.now());
    });
    console.log('✅ Tabela "materiais" criada com sucesso.');

    // --- Tabela de Mensagens ---
    await db.schema.dropTableIfExists('mensagens');
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
    console.log('✅ Tabela "mensagens" criada com sucesso.');

    // --- Tabela de Perfil ---
    await db.schema.dropTableIfExists('perfil');
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
        table.string('lattes_url'); 
        table.string('website_url'); 
    });
    const salt = await bcrypt.genSalt(10);
    const senhaHashProfessor = await bcrypt.hash('123', salt);
    await db('perfil').insert({ id: 2, nome: 'Matheus de Oliveira', cargo: 'Professor', email: 'matheus12@gmail.com', senha: senhaHashProfessor, imagem_url: '/uploads/images/default-avatar.png' });
    await db('perfil').insert({ id: 1, nome: 'Ridis Pereira Ribeiro', cargo: 'Professor', email: 'professor@email.com', senha: senhaHashProfessor, imagem_url: '/uploads/images/default-avatar.png' });
    console.log('✅ Tabela "perfil" criada e populada com sucesso.');

    // --- Tabelas de Projetos e Mídias (Portfólio) ---
    await db.schema.dropTableIfExists('portfolio_media'); // Apaga a de mídias primeiro
    await db.schema.dropTableIfExists('projetos');
    
    await db.schema.createTable('projetos', table => {
        table.increments('id').primary();
        table.string('titulo').notNullable();
        table.text('descricao').notNullable();
        table.string('categoria').notNullable();
        table.string('status').notNullable();
        table.string('periodo').notNullable();
        table.string('tags');
        table.string('link_externo');
        table.timestamp('data_criacao').defaultTo(db.fn.now());
    });
    await db('projetos').insert([ { titulo: 'Metodologias Ativas', descricao: 'Investigação sobre a eficácia das metodologias.', categoria: 'pesquisa', status: 'concluido', periodo: '2022-2024' }]);
    console.log('✅ Tabela "projetos" criada e populada com sucesso.');

    // --- TABELA "portfolio_media" ADICIONADA AQUI ---
    await db.schema.createTable('portfolio_media', table => {
        table.increments('id').primary();
        table.string('caminho_arquivo').notNullable();
        table.string('tipo_midia').notNullable(); // 'imagem' ou 'video'
        table.integer('projeto_id').unsigned().notNullable().references('id').inTable('projetos').onDelete('CASCADE');
    });
    console.log('✅ Tabela "portfolio_media" criada com sucesso.');
    
    // --- Tabela de Eventos ---
    await db.schema.dropTableIfExists('eventos');
    await db.schema.createTable('eventos', table => { 
        table.increments('id').primary(); 
        table.string('title').notNullable(); 
        table.string('date').notNullable(); 
        table.string('type').notNullable(); 
    });
    await db('eventos').insert([ { title: 'Reunião Pedagógica', date: new Date().toISOString().split('T')[0], type: 'reuniao' } ]);
    console.log('✅ Tabela "eventos" criada e populada com sucesso.');

    console.log('\n🎉 Configuração do banco de dados concluída com sucesso!');
  } catch (err) {
    console.error("❌ Erro ao configurar a base de dados:", err);
  } finally {
    db.destroy();
  }
}

setupDatabase();