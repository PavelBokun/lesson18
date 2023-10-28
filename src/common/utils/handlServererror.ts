import { appActions } from "app/app.reducer";
import { AppDispatch } from "app/store";
import { ResponseType } from "common/api/instance";

export const handleServerAppError =<D> (data: ResponseType, dispatch: AppDispatch):void => {
    if (data.messages.length){
      dispatch(appActions.setAppError({ error: data.messages[0] }));
    } else {
      dispatch(appActions.setAppError({ error: "Some error occurred" }));
    }
    dispatch(appActions.setAppStatus({ status: "failed" }));
  };
