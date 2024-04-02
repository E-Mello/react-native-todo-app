import { Button, Modal, ScrollView, Text, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";

import TaskItem from "./TaskItem";
import TaskModal from "./TaskModal";
import { styles } from "./styles";
import { styles as stylesTaskModal } from "./stylesTaskModal";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Atualiza as tarefas sempre que o estado showCompleted mudar
    filterTasksToShow();
    fetchTasks();
  }, [showCompleted]);

  const filterTasksToShow = () => {
    let tasksToRender: Task[];

    if (showCompleted) {
      tasksToRender = tasks.filter((task) => task.completed);
    } else {
      tasksToRender = tasks.filter((task) => !task.completed);
    }

    return tasksToRender;
  };

  const fetchTasks = async () => {
    console.log(showCompleted);
    let completeState = JSON.stringify(showCompleted).toString();
    console.log("Complete state string", completeState);
    try {
      const response = await fetch(
        `<seu_ip>:5000/tasks?show_completed=${completeState}`
      );
      const data = await response.json();
      setTasks(data);
      console.log("Tasks fetched successfully:", data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const renderTasks = () => {
    const renderFilteredTasks = filterTasksToShow();

    if (renderFilteredTasks.length === 0) {
      return (
        <View style={styles.noneTasks}>
          <Text>Nenhuma tarefa cadastrada.</Text>
        </View>
      );
    }

    return renderFilteredTasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        editTask={() => {
          setEditingTaskId(task.id);
          setNewTaskTitle(task.title);
          setNewTaskDescription(task.description);
          setModalVisible(true);
        }}
        deleteTask={() => handleDeleteTask(task.id)}
        toggleTaskCompletion={() => toggleTaskCompletion(task.id)}
      />
    ));
  };

  const toggleTaskCompletion = async (taskId: String) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId);

      if (taskToUpdate) {
        const updatedTask = {
          ...taskToUpdate,
          completed: !taskToUpdate.completed,
        };

        const response = await fetch(
          `<seu_ip>:5000/tasks/${taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTask),
          }
        );

        if (response.ok) {
          const updatedTasks = tasks.map((task) =>
            task.id === taskId ? updatedTask : task
          );
          setTasks(updatedTasks);
        } else {
          console.error("Task update failed:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const createTask = async () => {
    if (newTaskTitle) {
      try {
        const response = await fetch("<seu_ip>:5000/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: newTaskTitle,
            description: newTaskDescription,
            completed: false,
          }),
        });

        if (response.ok) {
          console.log("Task created successfully.");
          await fetchTasks();
          closeAndClearModal(); // Fechar e limpar a modal após criar a tarefa
        } else {
          console.error("Task creation failed:", response.statusText);
        }
      } catch (error) {
        console.error("Error creating task:", error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`<seu_ip>:5000/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await fetchTasks(); // Atualize a lista de tarefas após a exclusão
      } else {
        console.error("Task deletion failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditTask = async (newTitle: string, newDescription: string) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === editingTaskId);

      if (taskToUpdate) {
        const updatedTask = {
          ...taskToUpdate,
          title: newTitle,
          description: newDescription,
        };

        const response = await fetch(
          `<seu_ip>:5000/tasks/${editingTaskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedTask),
          }
        );

        if (response.ok) {
          const updatedTasks = tasks.map((task) =>
            task.id === editingTaskId ? updatedTask : task
          );
          setTasks(updatedTasks);
          closeAndClearModal(); // Fechar e limpar a modal de edição após a atualização
        } else {
          console.error("Task update failed:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const closeAndClearModal = () => {
    setModalVisible(false);
    setEditingTaskId(null); // Limpar o ID de edição
    setNewTaskTitle(""); // Limpar o título
    setNewTaskDescription(""); // Limpar a descrição
  };

  return (
    <View style={styles.container}>
      <Button
        title={
          showCompleted
            ? "Mostrar tarefas pendentes"
            : "Mostrar tarefas concluídas"
        }
        onPress={() => {
          setShowCompleted(!showCompleted);
        }}
      />

      <View style={styles.newTaskButton}>
        <Button title="Nova Tarefa" onPress={openModal} />
      </View>

      <ScrollView style={styles.scrollRenderTasks}>
        <View style={styles.renderTasks}>{renderTasks()}</View>
      </ScrollView>

      {/* Modal */}
      <TaskModal
        modalVisible={modalVisible}
        editingTaskId={editingTaskId}
        newTaskTitle={newTaskTitle}
        newTaskDescription={newTaskDescription}
        closeAndClearModal={closeAndClearModal}
        saveTask={
          editingTaskId
            ? () => handleEditTask(newTaskTitle, newTaskDescription)
            : createTask
        }
        setNewTaskTitle={setNewTaskTitle}
        setNewTaskDescription={setNewTaskDescription}
        setEditingTaskId={setEditingTaskId}
        handleEditTask={handleEditTask}
        createTask={createTask}
      />
    </View>
  );
};

export default TasksView;
