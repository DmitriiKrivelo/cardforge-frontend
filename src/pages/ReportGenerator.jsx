import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';

const ReportGenerator = () => {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('excel');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAndCards();
  }, []);

  const fetchUserAndCards = async () => {
    try {
      const userResponse = await api.get('/api/auth/me');
      setUser(userResponse.data);
      setIsAdmin(userResponse.data.role === 'admin');

      const endpoint = userResponse.data.role === 'admin' ? '/api/admin/cards' : '/api/cards';
      const cardsResponse = await api.get(endpoint);
      setCards(cardsResponse.data);
    } catch (err) {
      console.error('Ошибка загрузки данных', err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleSelectAll = (e) => {
    setSelectAll(e.target.checked);
    setSelectedCardIds(e.target.checked ? cards.map(c => c.id) : []);
  };

  const handleCardToggle = (cardId) => {
    setSelectedCardIds(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const generateReport = async () => {
    if (selectedCardIds.length === 0) {
      alert('Выберите хотя бы одну визитку');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/api/admin/reports/data' : '/api/reports/data';
      const params = new URLSearchParams();
      params.append('cardIds', selectedCardIds.join(','));
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await api.get(`${endpoint}?${params.toString()}`);
      const data = response.data;

      if (data.length === 0) {
        alert('Нет данных за выбранный период');
        setLoading(false);
        return;
      }

      const grouped = data.reduce((acc, item) => {
        if (!acc[item.card_id]) {
          acc[item.card_id] = {
            title: item.card_title,
            user_email: item.user_email,
            views: []
          };
        }
        acc[item.card_id].views.push(item.viewed_at);
        return acc;
      }, {});

      const chartData = {};
      Object.keys(grouped).forEach(cardId => {
        const views = grouped[cardId].views;
        const counts = views.reduce((acc, date) => {
          const d = new Date(date).toISOString().slice(0,10);
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});
        const sortedDates = Object.keys(counts).sort();
        chartData[cardId] = {
          title: grouped[cardId].title,
          user_email: grouped[cardId].user_email,
          labels: sortedDates,
          values: sortedDates.map(d => counts[d])
        };
      });

      if (format === 'excel') {
        await generateExcel(grouped);
      } else {
        await generatePDF(grouped, chartData);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка формирования отчета');
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = async (grouped) => {
    const workbook = new ExcelJS.Workbook();
    const dataSheet = workbook.addWorksheet('Данные');
    
    dataSheet.addRow(['Название визитки', 'Пользователь', 'Дата просмотра']);
    
    Object.keys(grouped).forEach(cardId => {
      const card = grouped[cardId];
      card.views.forEach(viewDate => {
        dataSheet.addRow([card.title, card.user_email, new Date(viewDate).toLocaleString()]);
      });
    });

    dataSheet.columns.forEach(col => {
      col.width = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `report_${Date.now()}.xlsx`);
  };

  const generatePDF = async (grouped, chartData) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Отчет по просмотрам визиток', 14, 20);

    const headers = ['Название визитки', 'Пользователь', 'Дата просмотра'];
    const rows = [];
    Object.keys(grouped).forEach(cardId => {
      const card = grouped[cardId];
      card.views.forEach(viewDate => {
        rows.push([card.title, card.user_email, new Date(viewDate).toLocaleString()]);
      });
    });

    const startY = 30;
    const colWidths = [60, 50, 45];
    const rowHeight = 6;
    let y = startY;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let x = 14;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += rowHeight;

    doc.setLineWidth(0.5);
    doc.line(14, y - 1, pageWidth - 14, y - 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    rows.forEach((row) => {
      x = 14;
      row.forEach((cell, i) => {
        const text = String(cell || '');
        const truncated = text.length > 25 ? text.slice(0, 22) + '...' : text;
        doc.text(truncated, x, y);
        x += colWidths[i];
      });
      y += rowHeight;
      if (y > 180) {
        doc.addPage();
        y = 20;
        doc.setFont('helvetica', 'bold');
        x = 14;
        headers.forEach((header, i) => {
          doc.text(header, x, y);
          x += colWidths[i];
        });
        y += rowHeight;
        doc.setFont('helvetica', 'normal');
      }
    });

    for (const cardId of Object.keys(chartData)) {
      const cd = chartData[cardId];
      
      doc.addPage();

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      document.body.appendChild(canvas);

      new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: cd.labels,
          datasets: [{
            label: `Просмотры (${cd.title})`,
            data: cd.values,
            borderColor: 'rgb(22, 101, 52)',
            backgroundColor: 'rgba(22, 101, 52, 0.1)',
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: true, labels: { font: { size: 12 } } },
            title: {
              display: true,
              text: `${cd.title} (${cd.user_email})`,
              font: { size: 14 }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Дата', font: { size: 12 } },
              ticks: { maxTicksLimit: 10 }
            },
            y: {
              title: { display: true, text: 'Кол-во просмотров', font: { size: 12 } },
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 400));

      const imageData = canvas.toDataURL('image/png');
      const imgWidth = 200;
      const imgHeight = 100;
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (doc.internal.pageSize.getHeight() - imgHeight) / 2;

      doc.addImage(imageData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      document.body.removeChild(canvas);
    }

    doc.save(`report_${Date.now()}.pdf`);
  };

  // --- Стили в едином дизайне сайта ---
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '20px auto',
      padding: '20px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    header: {
      backgroundColor: '#166534',
      borderRadius: '15px',
      padding: '25px 30px',
      marginBottom: '25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '15px',
    },
    title: {
      color: 'white',
      fontSize: '28px',
      marginBottom: '8px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    subtitle: {
      color: '#dcfce7',
      fontSize: '14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    dashboardButton: {
      padding: '10px 20px',
      backgroundColor: '#22c55e',
      color: '#1e293b',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '25px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#166534',
      marginBottom: '15px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#374151',
      fontSize: '14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '10px',
      marginBottom: '15px',
      maxHeight: '250px',
      overflowY: 'auto',
      padding: '10px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#374151',
      cursor: 'pointer',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    checkbox: {
      width: '16px',
      height: '16px',
      cursor: 'pointer',
    },
    row: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      marginBottom: '20px',
    },
    select: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      backgroundColor: 'white',
      marginLeft: '10px',
    },
    submitButton: {
      padding: '12px 24px',
      backgroundColor: '#15803d',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '16px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      transition: 'background-color 0.2s',
    },
    submitButtonDisabled: {
      padding: '12px 24px',
      backgroundColor: '#9ca3af',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      fontWeight: 'bold',
      fontSize: '16px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    userInfo: {
      color: '#666',
      fontSize: '14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    adminBadge: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: '10px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '20px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Шапка */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Отчеты по просмотрам</h1>
          <p style={styles.subtitle}>Сформируйте отчет по визиткам за выбранный период</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>
          ← В дашборд
        </button>
      </div>

      {/* Основной блок */}
      <div style={styles.card}>
        {/* Информация о пользователе */}
        <div style={styles.userInfo}>
          Вы: <strong>{isAdmin ? 'Администратор' : 'Пользователь'}</strong>
          {isAdmin && <span style={styles.adminBadge}>доступны все визитки</span>}
        </div>
      </div>

      {/* Выбор визиток */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Выберите визитки</h3>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            style={styles.checkbox}
          />
          <strong>Выбрать все</strong>
        </label>
        <div style={styles.checkboxGroup}>
          {cards.map(card => (
            <label key={card.id} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedCardIds.includes(card.id)}
                onChange={() => handleCardToggle(card.id)}
                style={styles.checkbox}
              />
              {card.title}
              {isAdmin && (
                <span style={{ color: '#999', fontSize: '12px' }}>
                  ({card.user_email || 'владелец'})
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Дата и формат */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Параметры отчета</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            Дата с:
            <input
              type="date"
              name="dateFrom"
              id="dateFrom"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ ...styles.select, marginLeft: '10px' }}
            />
          </label>
          <label style={styles.label}>
            Дата по:
            <input
              type="date"
              name="dateTo"
              id="dateTo"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ ...styles.select, marginLeft: '10px' }}
            />
          </label>
          <label style={styles.label}>
            Формат:
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              style={styles.select}
            >
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>
        <div style={styles.footer}>
          <button
            onClick={generateReport}
            disabled={loading}
            style={loading ? styles.submitButtonDisabled : styles.submitButton}
          >
            {loading ? 'Формирование...' : 'Сформировать отчет'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;