import { Redirect } from 'expo-router';

/**
 * Redirect para (tabs) - Home
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
