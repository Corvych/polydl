import { Redirect } from "expo-router";
import { AuthProvider } from "../context/AuthProvider.jsx"
import LoginScreen from "./login.jsx";

export default function Index() {
  return (
    <AuthProvider>
      <LoginScreen/>
    </AuthProvider>)
}
