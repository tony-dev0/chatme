import { createContext, useEffect, useReducer } from "react";
import AuthReducer from "./AuthReducer";

const INITIAL_STATE: AuthContextType = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  isFetching: false,
  error: false,
  dispatch: () => null, // Placeholder for dispatch
};

export const AuthContext = createContext<AuthContextType>(INITIAL_STATE);

interface AuthContextType {
  user: any;
  isFetching: boolean;
  error: boolean;
  dispatch: React.Dispatch<any>;
}

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(state.user));
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isFetching: state.isFetching,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
