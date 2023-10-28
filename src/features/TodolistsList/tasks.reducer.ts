// import {
//   CreatTask,
//   TaskPriorities,
//   TaskStatuses,
//   TaskType,
//   todolistsAPI,
//   UpdateTaskAgr,
//   UpdateTaskModelType,
// } from "common/api/instance";
import { AppThunk } from "app/store";
// import { handleServerNetworkError } from "utils/handleServerNetvorkError";
import { appActions } from "app/app.reducer";
import { todolistsActions } from "features/TodolistsList/todolists.reducer";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clearTasksAndTodolists } from "common/actions/common.actions";
import { Action } from "@remix-run/router";
import { createAppAsyncThunk } from "common/utils/create-app-async-thunk";
import { handleServerAppError, handleServerNetworkError } from "common/utils";
import { CreatTask, TaskType, todolistsAPI, UpdateTaskAgr, UpdateTaskModelType } from "features/TodolistsList/todolistsApi";
import { TaskPriorities, TaskStatuses } from "common/enum/enums";
// import { createAppAsyncThunk } from "utils/create-app-async-thunk";
// import { handleServerAppError } from "utils/handlServererror";

const initialState: TasksStateType = {};

const slice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    removeTask: (state, action: PayloadAction<{ taskId: string; todolistId: string }>) => {
      const tasks = state[action.payload.todolistId];
      const index = tasks.findIndex((t) => t.id === action.payload.taskId);
      if (index !== -1) tasks.splice(index, 1);
    },
    // addTask: (state, action: PayloadAction<{ task: TaskType }>) => {
    //   const tasks = state[action.payload.task.todoListId];
    //   tasks.unshift(action.payload.task);
    // },
    // updateTask: (
    //   state,
    //   action: PayloadAction<{
    //     taskId: string;
    //     model: UpdateDomainTaskModelType;
    //     todolistId: string;
    //   }>
    // ) => {
    //   const tasks = state[action.payload.todolistId];
    //   const index = tasks.findIndex((t) => t.id === action.payload.taskId);
    //   if (index !== -1) {
    //     tasks[index] = { ...tasks[index], ...action.payload.model };
    //   }
    // },
    // setTasks: (state, action: PayloadAction<{ tasks: Array<TaskType>; todolistId: string }>) => {
    //   state[action.payload.todolistId] = action.payload.tasks;
    // },
    // clearTasks: ()=>{
    //   return {}            // заненяет clearTasksAndTodolists
    // }
  },
  extraReducers: (builder) => {
    builder
      .addCase(todolistsActions.addTodolist, (state, action) => {
        state[action.payload.todolist.id] = [];
      })
      .addCase(todolistsActions.removeTodolist, (state, action) => {
        delete state[action.payload.id];
      })
      .addCase(todolistsActions.setTodolists, (state, action) => {
        action.payload.todolists.forEach((tl) => {
          state[tl.id] = [];
        });
      })
      .addCase(clearTasksAndTodolists.type, () => {
        return {};
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state[action.payload.todolistId] = action.payload.tasks;
      })

      .addCase(fetchTasks.rejected, (state, action) => {})

      .addCase(addTask.fulfilled, (state, action) => {
        const tasks = state[action.payload.task.todoListId];
        tasks.unshift(action.payload.task);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const tasks = state[action.payload.todolistId];
        const index = tasks.findIndex((t) => t.id === action.payload.taskId);
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...action.payload.domainModel };
        }
      });
  },
});

// thunks
//
export const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[]; todolistId: string }, string>(
  "tasks/fetchTasks",
  async (todolistId: string, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    try {
      dispatch(appActions.setAppStatus({ status: "loading" }));
      const res = await todolistsAPI.getTasks(todolistId);
      const tasks = res.data.items;
      // dispatch(tasksActions.setTasks({ tasks, todolistId }));
      dispatch(appActions.setAppStatus({ status: "succeeded" }));
      return { tasks, todolistId };
    } catch (e) {
      handleServerNetworkError(e, dispatch);
      return rejectWithValue(null);
    } finally {
      dispatch(appActions.setAppStatus({ status: "succeeded" }));
    }
  }
);
export const removeTaskTC =
  (taskId: string, todolistId: string): AppThunk =>
  (dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId).then(() => {
      dispatch(tasksActions.removeTask({ taskId, todolistId }));
    });
  };

 export const addTask = createAppAsyncThunk<{ task: TaskType }, CreatTask>(`${slice.name}/addTask`, async (arg, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI;
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }));
    const res = await todolistsAPI.createTask(arg);
    if (res.data.resultCode === 0) {
      const task = res.data.data.item;
      dispatch(appActions.setAppStatus({ status: "succeeded" }));
      // dispatch(tasksActions.addTask({ task }));
      return { task };
    } else {
      handleServerAppError(res.data, dispatch);
      return rejectWithValue(null);
    }
  } catch (e) {
    handleServerNetworkError(e, dispatch);
    return rejectWithValue(null);
  }
});

const updateTask = createAppAsyncThunk<UpdateTaskAgr, UpdateTaskAgr>(
  `${slice.name}/updateTask`,
  async (arg, thunkAPI) => {
    const { dispatch, rejectWithValue, getState } = thunkAPI;
    try {
      const state = getState();
      const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId);
      if (!task) {
        //throw new Error("task not found in the state");
        console.warn("task not found in the state");
        return rejectWithValue(null);
      }
      const apiModel: UpdateTaskModelType = {
        deadline: task.deadline,
        description: task.description,
        priority: task.priority,
        startDate: task.startDate,
        title: task.title,
        status: task.status,
        ...arg.domainModel,
      };

      const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel);
      if (res.data.resultCode === 0) {
        return arg;
      } else {
        handleServerAppError(res.data, dispatch);
        return rejectWithValue(null);
      }
    } catch (e) {
      handleServerNetworkError(e, dispatch);
      return rejectWithValue(null);
    }
  }
);



// types
export type UpdateDomainTaskModelType = {
  title?: string;
  description?: string;
  status?: TaskStatuses;
  priority?: TaskPriorities;
  startDate?: string;
  deadline?: string;
};
export type TasksStateType = {
  [key: string]: Array<TaskType>;
};

export const tasksReducer = slice.reducer;
export const tasksActions = slice.actions;
export const tasksThunks = { fetchTasks, addTask, updateTask };
