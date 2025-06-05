import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, X, Bell, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  // Effects
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;  // eslint-disable-next-line
    }
    setIsAuthenticated(true);
    fetchTodos();
  }, [navigate]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }// eslint-disable-next-line
  }, []);

  useEffect(() => {
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);   // eslint-disable-next-line
  }, [tasks]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);   // eslint-disable-next-line
  }, []);

  // API Calls
  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/todos', {
        headers: { 'x-auth-token': token }
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/todos', {
        text: newTask.trim(),
        time: newTime || null,
        date: newDate,
      }, {
        headers: { 'x-auth-token': token }
      });
      setTasks([...tasks, res.data]);
      setNewTask('');
      setNewTime('');
      setNewDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(`/api/todos/${id}`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data?.message === 'Todo removed') {
        setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Failed to delete todo');
      }
    }
  };

  const toggleComplete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const task = tasks.find(t => t._id === id);
      const res = await axios.put(`/api/todos/${id}`, {
        completed: !task.completed
      }, {
        headers: { 'x-auth-token': token }
      });
      setTasks(tasks.map(task => task._id === id ? res.data : task));
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/todos/${editingId}`, {
        text: editText,
        time: editTime || null,
        date: editDate,
      }, {
        headers: { 'x-auth-token': token }
      });
      setTasks(tasks.map(task => task._id === editingId ? res.data : task));
      cancelEdit();
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  // Helper Functions
  const checkNotifications = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    tasks.forEach(task => {
      if (task.time && task.time === currentTime && !task.completed && !task.notified) {
        showNotification(task);
        setTasks(prev => prev.map(t => 
          t._id === task._id ? { ...t, notified: true } : t
        ));
      }
    });
  };

  const showNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task Reminder', {
        body: `Time for: ${task.text}`,
        icon: '🔔'
      });
    }
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditText(task.text);
    setEditTime(task.time || '');
    setEditDate(task.date || new Date().toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditTime('');
    setEditDate('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Computed Values
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg,rgb(205, 211, 233) 0%,rgb(255, 255, 255) 100%)',
      padding: isMobile ? '16px' : '32px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: 'black',
    },
    maxWidth: {
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      backdropFilter: 'blur(8.5px)',
      WebkitBackdropFilter: 'blur(8.5px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      padding: isMobile ? '16px' : '32px'
    },
    header: {
      textAlign: 'center',
      marginBottom: isMobile ? '32px' : '48px'
    },
    headerTitle: {
      fontSize: isMobile ? '32px' : '44px',
      fontWeight: '900',
      letterSpacing: '2px',
      marginBottom: '8px',
      textShadow: '2px 2px 6px rgba(0,0,0,0.3)'
    },
    headerSubtitle: {
      fontSize: isMobile ? '16px' : '20px',
      fontWeight: '500',
      color: 'black',
      opacity: 0.9
    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: '16px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      padding: isMobile ? '20px' : '32px',
      marginBottom: isMobile ? '24px' : '32px',
      border: '1px solid rgba(255,255,255,0.35)'
    },
    cardTitle: {
      fontSize: isMobile ? '22px' : '26px',
      fontWeight: '700',
      marginTop: '15px',
      marginBottom: '20px',
      color: 'black',
      textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
      marginLeft: '8px',
      textAlign: 'left'
    },
    formRowSm: {
      display: 'grid',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '16px',
      alignItems: isMobile ? 'stretch' : 'center'
    },
    input: {
      flex: 1,
      padding: isMobile ? '12px 18px' : '14px 20px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '18px',
      backgroundColor: 'rgba(255,255,255,0.85)',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      outline: 'none',
      transition: 'box-shadow 0.3s ease',
      color: 'black'
    },
    inputFocus: {
      boxShadow: '0 0 6px 3px rgba(96, 165, 250, 0.7)',
    },
    dateTimeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: isMobile ? '12px' : '14px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255,255,255,0.85)',
      flexBasis: isMobile ? 'auto' : '140px',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    },
    dateTimeInput: {
      outline: 'none',
      fontSize: '16px',
      border: 'none',
      width: '100%',
      backgroundColor: 'transparent',
      color: 'black',
      fontWeight: '600',
      cursor: 'pointer'
    },
    button: {
      padding: isMobile ? '12px 20px' : '14px 28px',
      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      color: 'white',
      borderRadius: '16px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      fontWeight: '700',
      fontSize: isMobile ? '16px' : '18px',
      boxShadow: '0 8px 15px rgba(37, 99, 235, 0.4)',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      marginTop: '12px',
      marginBottom: '15px'
    },
    buttonHover: {
      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
      boxShadow: '0 12px 20px rgba(37, 99, 235, 0.6)'
    },
    filterContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: isMobile ? '20px' : '32px',
      justifyContent: 'center'
    },
    filterButton: {
      padding: isMobile ? '8px 16px' : '10px 24px',
      borderRadius: '20px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
      cursor: 'pointer',
      fontSize: isMobile ? '15px' : '18px',
      color: 'black',
      backgroundColor: 'transparent',
      boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
    },
    filterButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: '2px solid #3b82f6',
      boxShadow: '0 6px 10px rgba(59, 130, 246, 0.6)'
    },
    filterButtonInactive: {
      backgroundColor: 'transparent',
      color: 'black',
      border: '2px solid transparent',
      boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
    },
    tasksContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    emptyState: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '14px',
      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
      padding: isMobile ? '32px' : '48px',
      textAlign: 'center',
      color: 'black'
    },
    emptyIcon: {
      fontSize: isMobile ? '56px' : '72px',
      marginBottom: '20px',
      textShadow: '1px 1px 4px rgba(0,0,0,0.15)'
    },
    emptyTitle: {
      fontSize: isMobile ? '22px' : '28px',
      fontWeight: '700',
      marginBottom: '12px',
      color: 'black',
      textShadow: '1px 1px 3px rgba(0,0,0,0.2)'
    },
    emptyText: {
      color: 'black',
      fontSize: isMobile ? '16px' : '18px'
    },
    taskCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '14px',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
      padding: isMobile ? '16px' : '24px',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.25)'
    },
    taskCardHover: {
      boxShadow: '0 12px 30px rgb(255, 255, 255)',
      borderColor: '#3b82f6'
    },
    taskCardCompleted: {
      opacity: 0.65,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.5)'
    },
    taskRow: {
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? '16px' : '20px',
      flexDirection: isMobile ? 'column' : 'row'
    },
    taskRowMobileMain: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '100%'
    },
    taskRowEditSm: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '20px',
      alignItems: isMobile ? 'stretch' : 'center'
    },
    editButtonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: isMobile ? 'flex-end' : 'flex-start'
    },
    checkbox: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '3px solid #93c5fd',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s',
      backgroundColor: 'transparent',
      flexShrink: 0,
      boxShadow: '0 0 5px rgba(147, 197, 253, 0.3)'
    },
    checkboxCompleted: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      color: 'black',
      boxShadow: '0 0 12px #10b981'
    },
    checkboxHover: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 10px #3b82f6'
    },
    taskContent: {
      flex: 1,
      minWidth: 0
    },
    taskText: {
      fontSize: isMobile ? '18px' : '20px',
      color: 'black',
      marginBottom: '6px',
      wordBreak: 'break-word',
      textShadow: '1px 1px 4px rgba(0,0,0,0.15)'
    },
    taskTextCompleted: {
      textDecoration: 'line-through',
      color: 'black'
    },
    taskMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '12px' : '24px',
      fontSize: '14px',
      color: 'black',
      flexWrap: 'wrap',
      fontWeight: '600',
      textShadow: '0 0 3px rgba(0,0,0,0.2)'
    },
    taskMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    taskActions: {
      display: 'flex',
      gap: '12px',
      alignSelf: isMobile ? 'flex-end' : 'center',
      marginTop: isMobile ? '12px' : '0'
    },
    actionButton: {
      padding: '10px',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s, color 0.3s',
      backgroundColor: 'transparent',
      color: 'black',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    },
    editButton: {
      color: '#3b82f6'
    },
    editButtonHover: {
      backgroundColor: 'rgba(59, 130, 246, 0.25)'
    },
    deleteButton: {
      color: '#ef4444'
    },
    deleteButtonHover: {
      backgroundColor: 'rgba(239, 68, 68, 0.25)'
    },
    saveButton: {
      padding: '10px 16px',
      backgroundColor: '#059669',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.6)',
      transition: 'background-color 0.3s ease'
    },
    cancelButton: {
      padding: '10px 16px',
      backgroundColor: '#475569',
      color: 'white',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.6)',
      transition: 'background-color 0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      {isAuthenticated && (
        <button 
          className="d-inline p-1 bg-danger text-white rounded-pill" 
          style={{width: "100px", marginLeft: '1200px'}}
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📝 My Tasks</h1>
          <p style={styles.headerSubtitle}>Stay organized and never miss a task!</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Add New Task</h2>
          <div style={styles.formRowSm}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter your task..."
              style={styles.input}
              onFocus={e => e.currentTarget.style.boxShadow = styles.inputFocus.boxShadow}
              onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)'}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <div style={styles.dateTimeContainer}>
              <Calendar style={{width: '18px', height: '18px', color: '#2563eb'}} />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={styles.dateTimeInput}
              />
            </div>
            <div style={styles.dateTimeContainer}>
              <Clock style={{width: '18px', height: '18px', color: '#2563eb'}} />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                style={styles.dateTimeInput}
              />
            </div>
            <button
              onClick={addTask}
              style={styles.button}
              onMouseOver={(e) => {
                e.target.style.background = styles.buttonHover.background;
                e.target.style.boxShadow = styles.buttonHover.boxShadow;
              }}
              onMouseOut={(e) => {
                e.target.style.background = styles.button.backgroundColor;
                e.target.style.boxShadow = styles.button.boxShadow;
              }}
            >
              <Plus style={{width: '18px', height: '18px'}} />
              {isMobile ? 'Add' : 'Add Task'}
            </button>
          </div>
        </div>

        <div style={styles.filterContainer}>
          {['all', 'pending', 'completed'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              style={{
                ...styles.filterButton,
                ...(filter === filterType ? styles.filterButtonActive : styles.filterButtonInactive)
              }}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <button 
            onClick={() => setTasks(prevTasks => prevTasks.filter(task => !task.completed))}
            style={styles.button}
          >
            Clear Completed Tasks
          </button>
        )}

        <div style={styles.tasksContainer}>
          {filteredTasks.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h3 style={styles.emptyTitle}>No tasks found</h3>
              <p style={styles.emptyText}>
                {filter === 'all' 
                  ? "Add your first task to get started!" 
                  : `No ${filter} tasks at the moment.`}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                style={{
                  ...styles.taskCard,
                  ...(task.completed ? styles.taskCardCompleted : {})
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = styles.taskCardHover.boxShadow;
                  e.currentTarget.style.borderColor = styles.taskCardHover.borderColor;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = styles.taskCard.boxShadow;
                  e.currentTarget.style.borderColor = styles.taskCard.borderColor;
                }}
              >
                {editingId === task._id ? (
                  <div style={styles.taskRowEditSm}>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      style={{...styles.input, padding: isMobile ? '10px 14px' : '10px 16px'}}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      onFocus={e => e.currentTarget.style.boxShadow = styles.inputFocus.boxShadow}
                      onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)'}
                    />
                    <div style={styles.dateTimeContainer}>
                      <Calendar style={{width: '18px', height: '18px', color: '#2563eb'}} />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={styles.dateTimeInput}
                      />
                    </div>
                    <div style={styles.dateTimeContainer}>
                      <Clock style={{width: '18px', height: '18px', color: '#2563eb'}} />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        style={styles.dateTimeInput}
                      />
                    </div>
                    <div style={styles.editButtonGroup}>
                      <button
                        onClick={saveEdit}
                        style={styles.saveButton}
                        title="Save Edit"
                      >
                        <Check style={{width: '18px', height: '18px'}} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={styles.cancelButton}
                        title="Cancel Edit"
                      >
                        <X style={{width: '18px', height: '18px'}} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.taskRow}>
                    <button
                      onClick={() => toggleComplete(task._id)}
                      style={{
                        ...styles.checkbox,
                        ...(task.completed ? styles.checkboxCompleted : {})
                      }}
                      onMouseOver={(e) => {
                        if (!task.completed) {
                          e.target.style.borderColor = styles.checkboxHover.borderColor;
                          e.target.style.boxShadow = styles.checkboxHover.boxShadow;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!task.completed) {
                          e.target.style.borderColor = styles.checkbox.borderColor;
                          e.target.style.boxShadow = styles.checkbox.boxShadow;
                        }
                      }}
                      aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                      title={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                    >
                      {task.completed && <Check style={{width: '18px', height: '18px'}} />}
                    </button>
                    
                    <div style={styles.taskContent}>
                      <div style={{
                        ...styles.taskText,
                        ...(task.completed ? styles.taskTextCompleted : {})
                      }}>
                        {task.text}
                      </div>
                      <div style={styles.taskMeta}>
                        <span style={styles.taskMetaItem}>
                          <Calendar style={{width: '14px', height: '14px'}} />
                          {task.date ? new Date(task.date).toLocaleDateString() : task.createdAt}
                        </span>
                        {task.time && (
                          <span style={styles.taskMetaItem}>
                            <Bell style={{width: '14px', height: '14px'}} />
                            {task.time}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={styles.taskActions}>
                      <button
                        onClick={() => startEdit(task)}
                        style={{...styles.actionButton, ...styles.editButton}}
                        title="Edit task"
                        onMouseOver={(e) => e.target.style.backgroundColor = styles.editButtonHover.backgroundColor}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        aria-label="Edit task"
                      >
                        <Edit3 style={{width: '18px', height: '18px'}} />
                      </button>
                      <button
                        onClick={() => deleteTask(task._id)}
                        style={{...styles.actionButton, ...styles.deleteButton}}
                        title="Delete task"
                        onMouseOver={(e) => e.target.style.backgroundColor = styles.deleteButtonHover.backgroundColor}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        aria-label="Delete task"
                      >
                        <Trash2 style={{width: '18px', height: '18px'}} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;

