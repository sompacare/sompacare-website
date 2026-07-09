import { Image } from "react-native";

const logo = require("../../assets/sompacare-logo.png");

export function BrandLogo({ height = 28 }: { height?: number }) {
  return (
    <Image
      source={logo}
      style={{ height, width: height * 2.2 }}
      resizeMode="contain"
      accessibilityLabel="Sompacare Solutions"
    />
  );
}
