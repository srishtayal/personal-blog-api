const fastify = require('fastify')({ logger: true });
const mysql = require('mysql2');
require('dotenv').config();  

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

fastify.get('/', async (request, reply) => {
  return { message: 'Welcome to the Personal Blog API!' };
});

fastify.get('/articles', async (request, reply) => {
  const { tags, published_date } = request.query;  
  let query = 'SELECT * FROM articles';

  if (tags || published_date) {
    query += ' WHERE';
    if (tags) {
      query += ` tags LIKE '%${tags}%'`;
    }
    if (published_date) {
      if (tags) query += ' AND';
      query += ` published_date >= '${published_date}'`;
    }
  }

  const [rows] = await db.promise().query(query);
  return rows;
});

fastify.get('/articles/:id', async (request, reply) => {
  const { id } = request.params;
  const [rows] = await db.promise().query('SELECT * FROM articles WHERE id = ?', [id]);
  if (rows.length === 0) {
    return reply.status(404).send({ message: 'Article not found' });
  }
  return rows[0];
});

fastify.post('/articles', async (request, reply) => {
  const { title, content, tags } = request.body;
  const query = 'INSERT INTO articles (title, content, tags) VALUES (?, ?, ?)';
  const [result] = await db.promise().query(query, [title, content, tags]);

  return { id: result.insertId, title, content, tags };
});

fastify.put('/articles/:id', async (request, reply) => {
  const { id } = request.params;
  const { title, content, tags } = request.body;
  const query = 'UPDATE articles SET title = ?, content = ?, tags = ? WHERE id = ?';
  const [result] = await db.promise().query(query, [title, content, tags, id]);

  if (result.affectedRows === 0) {
    return reply.status(404).send({ message: 'Article not found' });
  }
  return { message: 'Article updated successfully' };
});

fastify.delete('/articles/:id', async (request, reply) => {
  const { id } = request.params;
  const query = 'DELETE FROM articles WHERE id = ?';
  const [result] = await db.promise().query(query, [id]);

  if (result.affectedRows === 0) {
    return reply.status(404).send({ message: 'Article not found' });
  }
  return { message: 'Article deleted successfully' };
});

fastify.listen({ port: process.env.SERVER_PORT, host: '127.0.0.1' }, (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    fastify.log.info(`Server listening at ${address}`);
  })