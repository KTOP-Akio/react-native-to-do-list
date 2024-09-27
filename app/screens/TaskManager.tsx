import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Task } from '@/utils/types';
import { generateUUID } from '@/utils/generateUUID';
import { Button, Card, TextInput, List, Checkbox, Menu } from 'react-native-paper';


export default function TaskManager() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');
    const [visible, setVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string>("All");
    const [selectedTasks, setSelectedTasks] = useState<Task[]>(tasks);

    const toggleMenu = () => setVisible(!visible);

    const filterTask = () => {
        switch (selectedFilter) {
            case "Completed":
                setSelectedTasks(tasks.filter(task => task.completed));
                return;
            case "Incompleted":
                setSelectedTasks(tasks.filter(task => task.completed === false));
                return;
            default:
                setSelectedTasks(tasks);
                return 
        }
    }

    useEffect(() => {
        loadTasksFromStorage();
    }, []);

    useEffect(() => {
        saveTasksToStorage(tasks);
    }, [tasks]);

    useEffect(() => {
        filterTask();
    }, [selectedFilter, tasks]);

    const addTask = () => {
        if (!newTaskTitle) return;
        const newTask: Task = { id: generateUUID(), title: newTaskTitle, completed: false };
        setTasks([...tasks, newTask]);
        setSelectedTasks([...selectedTasks, newTask]);
        setNewTaskTitle('');
    };

    const deleteTask = (taskId: string) => {
        setSelectedTasks(selectedTasks.filter(task => task.id !== taskId));
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    const editTask = (taskId: string, newTitle: string) => {
        setSelectedTasks(selectedTasks.map(task => (task.id === taskId ? { ...task, title: newTitle } : task)));
        setTasks(tasks.map(task => (task.id === taskId ? { ...task, title: newTitle } : task)));
        setEditingTaskId(null);
        setEditingTaskTitle('');
    };

    const startEditingTask = (taskId: string, currentTitle: string) => {
        setEditingTaskId(taskId);
        setEditingTaskTitle(currentTitle);
    };

    const toggleTaskCompletion = (taskId: string) => {
        setSelectedTasks(selectedTasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
        setTasks(tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task)));
    };

    const reorderTasks = (data: Task[]) => {
        setTasks(data);
    };

    const saveTasksToStorage = async (tasks: Task[]) => {
        try {
            const jsonValue = JSON.stringify(tasks);
            await AsyncStorage.setItem('@tasks', jsonValue);
        } catch (e) {
            console.error('Error saving tasks', e);
        }
    };

    const loadTasksFromStorage = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@tasks');
            if (jsonValue != null) {
                setTasks(JSON.parse(jsonValue));
            }
        } catch (e) {
            console.error('Error loading tasks', e);
        }
    };

    return (
        <View style={styles.scrollContainer}>
            {/* Task Input */}
            <TextInput
                label="Enter task"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                mode="outlined"
                style={styles.input}
            />
            <Button style={styles.button} mode="contained" onPress={addTask}>
                Add Task
            </Button>

            {/* Dropdown for filtering */}
            <Menu
                visible={visible}
                onDismiss={toggleMenu}
                anchor={<Button onPress={toggleMenu} style={styles.button} mode="contained">Filter: {selectedFilter}</Button>}
            >
                <Menu.Item onPress={() => { setSelectedFilter('All'); toggleMenu(); }} title="All" />
                <Menu.Item onPress={() => { setSelectedFilter('Incompleted'); toggleMenu(); }} title="Incompleted" />
                <Menu.Item onPress={() => { setSelectedFilter('Completed'); toggleMenu(); }} title="Completed" />
            </Menu>

            {/* Draggable Task List */}
            <DraggableFlatList
                data={selectedTasks}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => reorderTasks(data)}
                renderItem={({ item, drag }) => (
                    <Card style={styles.taskCard} onLongPress={drag}>
                        <Card.Content>
                            {editingTaskId === item.id ? (
                                <TextInput
                                    label="Edit task"
                                    value={editingTaskTitle}
                                    onChangeText={setEditingTaskTitle}
                                    mode="outlined"
                                />
                            ) : (
                                <List.Item
                                    title={item.title}
                                    titleStyle={{ textDecorationLine: item.completed ? 'line-through' : 'none' }}
                                    left={() => (
                                        <Checkbox
                                            status={item.completed ? 'checked' : 'unchecked'}
                                            onPress={() => toggleTaskCompletion(item.id)}
                                        />
                                    )}
                                />
                            )}
                        </Card.Content>
                        <Card.Actions>
                            {editingTaskId === item.id ? (
                                <Button onPress={() => editTask(item.id, editingTaskTitle)}>Save</Button>
                            ) : (
                                <Button onPress={() => startEditingTask(item.id, item.title)}>Edit</Button>
                            )}
                            <Button onPress={() => deleteTask(item.id)}>Delete</Button>
                        </Card.Actions>
                    </Card>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingTop: 50,
        paddingHorizontal: 20,
        flexGrow: 1, // Allows ScrollView to expand
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginBottom: 10,
    },
    taskCard: {
        marginVertical: 10,
    },
});