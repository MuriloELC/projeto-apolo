import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AppDataProvider } from "./src/storage/AppDataContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AppDataProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AppDataProvider>
  );
}
