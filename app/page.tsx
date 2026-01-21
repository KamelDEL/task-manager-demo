"use client";

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, Users, X, Home, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

type Task = {
  id: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

export default function TaskManagerDemo() {
  const [mounted, setMounted] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDate, setNewTaskDate] = useState('');

  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: 't1', content: 'Design System Update', priority: 'high', date: 'Oct 24' },
        { id: 't2', content: 'User Research', priority: 'medium', date: 'Oct 25' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [
        { id: 't3', content: 'API Integration', priority: 'high', date: 'Oct 23' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        { id: 't4', content: 'Homepage Animation', priority: 'low', date: 'Oct 20' },
      ],
    },
  ]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('task_manager_columns');
    if (saved) {
      try {
        setColumns(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load tasks', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('task_manager_columns', JSON.stringify(columns));
    }
  }, [columns, mounted]);

  const openNewTask = () => {
    setActiveTask(null);
    setNewTaskContent('');
    setNewTaskPriority('medium');
    setNewTaskDate('');
    setIsOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setActiveTask(task);
    setNewTaskContent(task.content);
    setNewTaskPriority(task.priority);
    setNewTaskDate(''); // Date parsing omitted for simplicity
    setIsOpen(true);
  };

  const handleSaveTask = () => {
    if (!newTaskContent) return;
    
    if (activeTask) {
        setColumns(prev => prev.map(col => ({
            ...col,
            tasks: col.tasks.map(t => t.id === activeTask.id ? {
                ...t,
                content: newTaskContent,
                priority: newTaskPriority,
                date: newTaskDate ? format(new Date(newTaskDate), 'MMM d') : t.date
            } : t)
        })));
    } else {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            content: newTaskContent,
            priority: newTaskPriority,
            date: newTaskDate ? format(new Date(newTaskDate), 'MMM d') : 'No Date'
        };
        const newColumns = [...columns];
        newColumns[0].tasks.push(newTask);
        setColumns(newColumns);
    }
    setIsOpen(false);
    setActiveTask(null);
    setNewTaskContent('');
    setNewTaskPriority('medium');
    setNewTaskDate('');
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    // Trash Logic
    if (destination.droppableId === 'trash') {
        const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
        const sourceCol = columns[sourceColIndex];
        const sourceTasks = Array.from(sourceCol.tasks);
        sourceTasks.splice(source.index, 1);

        const newColumns = [...columns];
        newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
        setColumns(newColumns);
        return;
    }

    if (source.droppableId === destination.droppableId) {
      const columnIndex = columns.findIndex(col => col.id === source.droppableId);
      const column = columns[columnIndex];
      const newTasks = Array.from(column.tasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      const newColumns = [...columns];
      newColumns[columnIndex] = { ...column, tasks: newTasks };
      setColumns(newColumns);
    } else {
      const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
      const destColIndex = columns.findIndex(col => col.id === destination.droppableId);
      
      const sourceCol = columns[sourceColIndex];
      const destCol = columns[destColIndex];

      const sourceTasks = Array.from(sourceCol.tasks);
      const destTasks = Array.from(destCol.tasks);

      const [movedTask] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, movedTask);

      const newColumns = [...columns];
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
      newColumns[destColIndex] = { ...destCol, tasks: destTasks };
      setColumns(newColumns);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 pt-20 relative z-10">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" asChild>
                <Link href="/">
                    <Home className="w-5 h-5" />
                </Link>
            </Button>
            <ThemeToggle />
            <div>
              <h1 className="text-3xl font-bold mb-1">Board</h1>
              <p className="text-muted-foreground">Mobile App Development</p>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewTask}>
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{activeTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Task Name</Label>
                  <Input 
                    id="content" 
                    placeholder="Enter task description..." 
                    value={newTaskContent}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTaskPriority} onValueChange={(val: any) => setNewTaskPriority(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Due Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTask}>{activeTask ? 'Save Changes' : 'Add Task'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Board */}
        {mounted ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {columns.map((column) => (
                <div key={column.id} className="flex flex-col h-full bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{column.title}</h2>
                      <span className="bg-muted text-xs px-2 py-0.5 rounded-full font-medium">{column.tasks.length}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 space-y-3"
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card group relative"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <Badge variant="secondary" className={`${getPriorityColor(task.priority)} border-0`}>
                                    {task.priority}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleOpenEdit(task)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="font-medium mb-4 text-sm">{task.content}</p>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center -space-x-2">
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={`https://avatar.vercel.sh/${task.id}`} />
                                      <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                      +2
                                    </div>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {task.date}
                                  </div>
                                </div>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
            
            <Droppable droppableId="trash">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 z-50 ${
                    snapshot.isDraggingOver 
                      ? 'bg-destructive scale-110 shadow-lg shadow-destructive/50' 
                      : 'bg-muted hover:bg-destructive/20'
                  } border-2 border-border`}
                >
                  <Trash2 className={`w-8 h-8 ${snapshot.isDraggingOver ? 'text-destructive-foreground animate-bounce' : 'text-muted-foreground'}`} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col h-full bg-card/50 rounded-xl p-4 border border-border/50 animate-pulse">
                   <div className="h-8 bg-muted rounded mb-4"></div>
                   <div className="flex-1 space-y-3">
                      <div className="h-32 bg-muted rounded"></div>
                      <div className="h-32 bg-muted rounded"></div>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}
