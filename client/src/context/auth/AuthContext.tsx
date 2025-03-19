import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userName: string | null;
    probability: number | null;
    setProb: (prob: number | null) => void;
    login: (token: string, userName: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userName, setUserName] = useState<string | null>(null);
    const [probability, setProbability] = useState<number | null>(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, userName: string) => {
        sessionStorage.setItem("token", token);
        setUserName(userName);
        setIsAuthenticated(true);
    };

    const setProb = (prob: number | null) => {
        setProbability(prob);
    };

    const logout = () => {
        sessionStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userName, probability, setProb, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
