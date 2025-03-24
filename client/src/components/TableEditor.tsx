import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface TableEditorProps {
  socket: Socket;
  documentId: string;
  isReadOnly: boolean;
}

interface Cell {
  id: string;
  value: string;
  displayValue: string;
  row: number;
  col: number;
}

const TableEditor: React.FC<TableEditorProps> = ({ socket, documentId, isReadOnly }) => {
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [rows, setRows] = useState(20);
  const [columns, setColumns] = useState(10);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string}[]>([]);

  // Подключение к комнате документа через сокеты
  useEffect(() => {
    if (!socket || !documentId) return;

    setLoading(true);

    // Присоединяемся к комнате документа
    socket.emit('join_document', { documentId });

    // Получаем начальные данные таблицы
    socket.on('document_data', (data) => {
      const cellsMap: Record<string, Cell> = {};
      
      data.cells.forEach((cell: Cell) => {
        cellsMap[cell.id] = cell;
      });
      
      setCells(cellsMap);
      setRows(data.rows);
      setColumns(data.columns);
      setActiveUsers(data.activeUsers || []);
      setLoading(false);
    });

    // Обработка обновления ячейки другим пользователем
    socket.on('cell_updated', (updatedCell: Cell) => {
      setCells(prevCells => ({
        ...prevCells,
        [updatedCell.id]: updatedCell
      }));
    });

    // Обработка присоединения/отключения пользователей
    socket.on('user_joined', (user) => {
      setActiveUsers(prev => [...prev, user]);
    });

    socket.on('user_left', (userId) => {
      setActiveUsers(prev => prev.filter(user => user.id !== userId));
    });

    return () => {
      socket.off('document_data');
      socket.off('cell_updated');
      socket.off('user_joined');
      socket.off('user_left');
      socket.emit('leave_document', { documentId });
    };
  }, [socket, documentId]);

  // Вспомогательные функции
  const getCellId = (row: number, col: number): string => {
    const colLetter = colToLetter(col);
    return `${colLetter}${row + 1}`;
  };

  const getCell = (row: number, col: number): Cell => {
    const id = getCellId(row, col);
    return cells[id] || { id, value: '', displayValue: '', row, col };
  };

  // Преобразование номера столбца в буквенное обозначение (0 -> A, 1 -> B, ...)
  const colToLetter = (col: number): string => {
    let letter = '';
    col++;
    while (col > 0) {
      let remainder = (col - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  };

  // Обработчики событий
  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellSubmit = () => {
    if (!selectedCell || isReadOnly) return;
    
    const currentCell = cells[selectedCell];
    const updatedCell = {
      ...currentCell,
      value: editValue
    };

    // Отправляем изменение на сервер
    socket.emit('update_cell', {
      documentId,
      cellId: selectedCell,
      value: editValue
    });

    // Оптимистичное обновление локального состояния
    setCells(prevCells => ({
      ...prevCells,
      [selectedCell]: updatedCell
    }));

    setSelectedCell(null);
    setEditValue('');
  };

  const handleCellSelect = (row: number, col: number) => {
    if (isReadOnly) return;
    
    const cellId = getCellId(row, col);
    setSelectedCell(cellId);
    setEditValue(cells[cellId]?.value || '');
  };

  // Рендеринг верхнего заголовка таблицы с буквами столбцов
  const renderTableHeader = () => {
    return (
      <tr>
        <th className="header-cell"></th>
        {Array.from({ length: columns }, (_, colIndex) => (
          <th key={colIndex} className="header-cell">
            {colToLetter(colIndex)}
          </th>
        ))}
      </tr>
    );
  };

  // Рендеринг строк таблицы
  const renderTableRows = () => {
    return Array.from({ length: rows }, (_, rowIndex) => (
      <tr key={rowIndex}>
        <td className="header-cell">{rowIndex + 1}</td>
        {Array.from({ length: columns }, (_, colIndex) => {
          const cell = getCell(rowIndex, colIndex);
          const isSelected = selectedCell === cell.id;
          
          return (
            <td 
              key={colIndex} 
              className={`cell ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCellSelect(rowIndex, colIndex)}
            >
              {isSelected ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => handleCellChange(e.target.value)}
                  onBlur={handleCellSubmit}
                  onKeyPress={(e) => e.key === 'Enter' && handleCellSubmit()}
                  autoFocus
                />
              ) : (
                <span>{cell.displayValue || cell.value}</span>
              )}
            </td>
          );
        })}
      </tr>
    ));
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="table-editor">
      <div className="active-users">
        <span>Сейчас работают: </span>
        {activeUsers.map(user => (
          <span key={user.id} className="user-badge">{user.name}</span>
        ))}
      </div>
      <div className="table-container">
        <table className="spreadsheet">
          <thead>
            {renderTableHeader()}
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>
      {isReadOnly && (
        <div className="readonly-notice">
          У вас режим просмотра. Редактирование недоступно.
        </div>
      )}
    </div>
  );
};

export default TableEditor;