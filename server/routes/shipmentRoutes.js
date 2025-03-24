const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Создаем пул подключений к базе данных
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'securegrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

/**
 * @route   GET /api/shipments
 * @desc    Получение всех записей из таблицы shipments
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shipments ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении данных из таблицы shipments:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных' });
  }
});

/**
 * @route   GET /api/shipments/:id
 * @desc    Получение записи по ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении записи:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении записи' });
  }
});

/**
 * @route   POST /api/shipments
 * @desc    Создание новой записи
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { package_name, weight, volume, transport_type, price, comments } = req.body;
    
    const result = await pool.query(
      'INSERT INTO shipments(package_name, weight, volume, transport_type, price, comments) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [package_name, weight, volume, transport_type, price, comments]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании записи' });
  }
});

/**
 * @route   PUT /api/shipments/:id
 * @desc    Обновление записи
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { package_name, weight, volume, transport_type, price, comments } = req.body;
    
    const result = await pool.query(
      'UPDATE shipments SET package_name = $1, weight = $2, volume = $3, transport_type = $4, price = $5, comments = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [package_name, weight, volume, transport_type, price, comments, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении записи:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении записи' });
  }
});

/**
 * @route   DELETE /api/shipments/:id
 * @desc    Удаление записи
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM shipments WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    res.json({ message: 'Запись успешно удалена', deletedRecord: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении записи' });
  }
});

module.exports = router;