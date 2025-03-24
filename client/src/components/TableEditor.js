import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TableEditor.css';

const TableEditor = ({ socket, documentId, isReadOnly }) => {
  const [cells, setCells] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [rows, setRows] = useState(10);
  const [cols, setColumns] = useState(10);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  // Загрузка данных о перевозках (shipments) из API
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Исправляем порт с 5000 на 5001, т.к. в Docker контейнере порт мапирован на 5001
        const response = await axios.get('http://localhost:5001/api/shipments', {
          // Добавляем таймаут для предотвращения бесконечного ожидания
          timeout: 5000,
        }).catch(error => {
          console.error('Ошибка при запросе к API:', error);
          throw new Error(`Не удалось подключиться к API: ${error.message}`);
        });
        
        if (!response || !response.data) {
          throw new Error('Не получены данные от API');
        }
        
        if (!Array.isArray(response.data)) {
          console.warn('API вернул не массив:', response.data);
          throw new Error('Получены некорректные данные от API (ожидался массив)');
        }
        
        console.log('Получены данные о перевозках:', response.data);
        setShipments(response.data);
        
        // Преобразуем данные для отображения в таблице
        const newCells = {};
        
        // Создаем заголовки
        const headers = ['ID', 'Название груза', 'Вес (кг)', 'Объем (м³)', 'Тип транспорта', 'Цена', 'Комментарии', 'Дата создания'];
        
        // Устанавливаем заголовки
        headers.forEach((header, col) => {
          newCells[`0-${col}`] = {
            id: `0-${col}`,
            value: header,
            displayValue: header,
            row: 0,
            col
          };
        });
        
        // Заполняем данные
        response.data.forEach((shipment, rowIndex) => {
          const row = rowIndex + 1; // +1 потому что первая строка - заголовки
          
          // ID
          newCells[`${row}-0`] = {
            id: `${row}-0`,
            value: shipment.id ? shipment.id.toString() : '',
            displayValue: shipment.id ? shipment.id.toString() : '',
            row,
            col: 0
          };
          
          // Название груза
          newCells[`${row}-1`] = {
            id: `${row}-1`,
            value: shipment.package_name || '',
            displayValue: shipment.package_name || '',
            row,
            col: 1
          };
          
          // Вес
          newCells[`${row}-2`] = {
            id: `${row}-2`,
            value: shipment.weight ? shipment.weight.toString() : '',
            displayValue: shipment.weight ? shipment.weight.toString() : '',
            row,
            col: 2
          };
          
          // Объем
          newCells[`${row}-3`] = {
            id: `${row}-3`,
            value: shipment.volume ? shipment.volume.toString() : '',
            displayValue: shipment.volume ? shipment.volume.toString() : '',
            row,
            col: 3
          };
          
          // Тип транспорта
          newCells[`${row}-4`] = {
            id: `${row}-4`,
            value: shipment.transport_type || '',
            displayValue: shipment.transport_type || '',
            row,
            col: 4
          };
          
          // Цена
          newCells[`${row}-5`] = {
            id: `${row}-5`,
            value: shipment.price ? shipment.price.toString() : '',
            displayValue: shipment.price ? shipment.price.toString() : '',
            row,
            col: 5
          };
          
          // Комментарии
          newCells[`${row}-6`] = {
            id: `${row}-6`,
            value: shipment.comments || '',
            displayValue: shipment.comments || '',
            row,
            col: 6
          };
          
          // Дата создания
          newCells[`${row}-7`] = {
            id: `${row}-7`,
            value: shipment.created_at ? new Date(shipment.created_at).toLocaleString() : '',
            displayValue: shipment.created_at ? new Date(shipment.created_at).toLocaleString() : '',
            row,
            col: 7
          };
        });
        
        setCells(newCells);
        
        // Устанавливаем размеры таблицы на основе данных
        setRows(response.data.length + 1 || 10); // +1 для заголовков, минимум 10 строк
        setColumns(headers.length);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        
        // Если это не последняя попытка, попробуем снова через 2 секунды
        if (retryCount < 3) {
          setRetryCount(prevCount => prevCount + 1);
          setTimeout(fetchShipments, 2000);
        } else {
          setError('Не удалось загрузить данные. Пожалуйста, обновите страницу или попробуйте позже.');
          setLoading(false);
          
          // В случае ошибки загрузки с сервера, создаем пустую структуру данных
          const newCells = {};
          const headers = ['ID', 'Название груза', 'Вес (кг)', 'Объем (м³)', 'Тип транспорта', 'Цена', 'Комментарии', 'Дата создания'];
          
          // Устанавливаем заголовки
          headers.forEach((header, col) => {
            newCells[`0-${col}`] = {
              id: `0-${col}`,
              value: header,
              displayValue: header,
              row: 0,
              col
            };
          });
          
          // Добавляем пустые строки
          for (let row = 1; row < 10; row++) {
            for (let col = 0; col < headers.length; col++) {
              newCells[`${row}-${col}`] = {
                id: `${row}-${col}`,
                value: '',
                displayValue: '',
                row,
                col
              };
            }
          }
          
          setCells(newCells);
          setRows(10);
          setColumns(headers.length);
        }
      }
    };
    
    fetchShipments();
  }, [retryCount]);

  // Использование socket для работы с документами
  useEffect(() => {
    if (!socket) return;
    
    // Присоединяемся к документу
    try {
      socket.emit('join-document', { documentId }, (response) => {
        if (response && response.cells) {
          // Если сервер прислал ячейки, объединяем их с нашими
          setCells(prevCells => ({
            ...prevCells,
            ...response.cells
          }));
        }
      });
      
      // Подписываемся на обновления ячеек
      socket.on('cell-update', (cell) => {
        setCells(prevCells => ({
          ...prevCells,
          [cell.id]: cell
        }));
      });
    } catch (error) {
      console.error('Ошибка при работе с сокетом:', error);
    }
    
    return () => {
      try {
        socket.off('cell-update');
        socket.emit('leave-document', { documentId });
      } catch (error) {
        console.error('Ошибка при отключении сокета:', error);
      }
    };
  }, [socket, documentId]);

  // Получение ячейки
  const getCell = (row, col) => {
    const cellId = `${row}-${col}`;
    return cells[cellId] || { id: cellId, value: '', displayValue: '', row, col };
  };

  // Получение ключа ячейки
  const getCellKey = (row, col) => {
    return `${row}-${col}`;
  };

  // Обработка клика по ячейке
  const handleCellClick = (row, col) => {
    if (isReadOnly) return;
    
    const cellId = `${row}-${col}`;
    setSelectedCell(cellId);
    setEditValue(cells[cellId]?.value || '');
    
    // Фокусировка на инпуте
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Обработка изменения значения в инпуте
  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  // Обработка нажатия клавиши в инпуте
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveCell();
    } else if (e.key === 'Escape') {
      setSelectedCell(null);
    }
  };

  // Обработка потери фокуса инпутом
  const handleInputBlur = () => {
    saveCell();
  };

  // Сохранение значения ячейки
  const saveCell = () => {
    if (!selectedCell || isReadOnly) return;

    const [row, col] = selectedCell.split('-').map(Number);

    const updatedCell = {
      id: selectedCell,
      value: editValue,
      displayValue: editValue,
      row,
      col
    };

    setCells(prevCells => ({
      ...prevCells,
      [selectedCell]: updatedCell
    }));

    // Отправляем обновление только если сокет существует
    if (socket && socket.connected) {
      try {
        socket.emit('update-cell', {
          documentId,
          row,
          col,
          value: editValue
        });
      } catch (error) {
        console.error('Ошибка при отправке данных через сокет:', error);
      }
    }

    setSelectedCell(null);
  };

  // Рендеринг редактора ячейки
  const renderEditorCell = () => {
    if (!selectedCell) return null;

    const [row, col] = selectedCell.split('-').map(Number);
    
    return (
      <div
        className="cell-editor"
        style={{
          // Динамически позиционируем редактор
          position: 'absolute',
          display: 'none' // Скрываем, т.к. используем inline редактор
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
        />
      </div>
    );
  };

  // Обработка добавления строки
  const handleAddRow = () => {
    setRows(prevRows => prevRows + 1);
    
    // Сокет может быть недоступен
    if (socket && socket.connected) {
      try {
        socket.emit('resize-table', {
          documentId,
          rows: rows + 1,
          cols
        });
      } catch (error) {
        console.error('Ошибка при отправке данных через сокет:', error);
      }
    }
  };

  // Обработка добавления столбца
  const handleAddColumn = () => {
    setColumns(prevCols => prevCols + 1);
    
    // Сокет может быть недоступен
    if (socket && socket.connected) {
      try {
        socket.emit('resize-table', {
          documentId,
          rows,
          cols: cols + 1
        });
      } catch (error) {
        console.error('Ошибка при отправке данных через сокет:', error);
      }
    }
  };

  // Рендеринг заголовка таблицы
  const renderHeader = () => {
    return (
      <div className="table-header">
        <h2>SecureGrid - Таблица перевозок</h2>
        <div className="table-toolbar">
          <button
            disabled={isReadOnly}
            onClick={handleAddRow}
          >
            Добавить строку
          </button>
          <button
            disabled={isReadOnly}
            onClick={handleAddColumn}
          >
            Добавить столбец
          </button>
          {error && <button onClick={() => setRetryCount(prev => prev + 1)}>Попробовать снова</button>}
        </div>
      </div>
    );
  };

  // Рендеринг ячейки
  const renderCell = (row, col) => {
    const cellId = `${row}-${col}`;
    const cell = cells[cellId];
    const isSelected = selectedCell === cellId;
    
    return (
      <td
        key={col}
        className={`table-cell ${isSelected ? 'selected' : ''}`}
        onClick={() => handleCellClick(row, col)}
      >
        {isSelected ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
          />
        ) : (
          <div className="cell-content">
            {cell?.displayValue || ''}
          </div>
        )}
      </td>
    );
  };

  // Рендеринг строки заголовков колонок
  const renderColumnHeaders = () => {
    return (
      <tr>
        <th className="corner-header">#</th>
        {Array.from({ length: cols }, (_, col) => (
          <th key={col} className="column-header">
            {String.fromCharCode(65 + col)}
          </th>
        ))}
      </tr>
    );
  };

  // Рендеринг строки
  const renderRow = (row) => {
    return (
      <tr key={row}>
        <th className="row-header">{row}</th>
        {Array.from({ length: cols }, (_, col) => renderCell(row, col))}
      </tr>
    );
  };

  // Рендеринг таблицы
  const renderTable = () => {
    if (loading) {
      return <div className="loading">Загрузка данных...</div>;
    }
    
    if (error) {
      return (
        <div className="error">
          <p>{error}</p>
          <p>Отображаются пустые данные. Вы можете работать с таблицей, но данные не будут сохранены на сервере.</p>
        </div>
      );
    }
    
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            {renderColumnHeaders()}
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => renderRow(row))}
          </tbody>
        </table>
        <div className="connection-status">
          {socket && socket.connected ? 
            <span className="connected">Соединение с сервером установлено ✓</span> : 
            <span className="disconnected">Нет соединения с сервером ✗</span>
          }
        </div>
      </div>
    );
  };

  return (
    <div className="table-editor">
      {renderHeader()}
      {renderTable()}
      {!isReadOnly && renderEditorCell()}
    </div>
  );
};

export default TableEditor;