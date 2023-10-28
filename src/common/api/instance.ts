import axios from "axios";
import { UpdateDomainTaskModelType } from "features/TodolistsList/tasks.reducer";


export const instance = axios.create({
  baseURL: "https://social-network.samuraijs.com/api/1.1/",
  withCredentials: true,
  headers: {
    "API-KEY": "1cdd9f77-c60e-4af5-b194-659e4ebd5d41",
  },
});

// api



// types

export type ResponseType<D = {}> = {
  resultCode: number;
  messages: Array<string>;
  data: D;
};


