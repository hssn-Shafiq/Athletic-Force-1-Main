export interface FormattedPart {
  id: string;
  rawName: string;
  meshName?: string;
  label: string;
  category: "front" | "back" | "left_arm" | "right_arm" | "collar" | "other";
  cameraCommand: "front" | "back" | "left" | "right";
  originalColor: string;
  icon: string;
  description: string;
}

export function getPartIcon(category: FormattedPart["category"]): string {
  switch (category) {
    case "front":
      return "👕";
    case "back":
      return "🔄";
    case "left_arm":
      return "👈";
    case "right_arm":
      return "👉";
    case "collar":
      return "⭕";
    default:
      return "✨";
  }
}

export function categorizeModelPart(
  rawName: string,
  originalColor = "#ffffff",
  meshName?: string
): FormattedPart {
  const combined = `${rawName} ${meshName || ""}`.toLowerCase();

  // Collar / Neck variations (handles "Neeck", "Neckless", "Neck.001", "rib", "collar")
  if (
    combined.includes("neeck") ||
    combined.includes("neck") ||
    combined.includes("collar") ||
    combined.includes("neckless") ||
    combined.includes("neckband") ||
    combined.includes("rib")
  ) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Collar / Neck",
      category: "collar",
      cameraCommand: "front",
      originalColor,
      icon: "⭕",
      description: "Neckband and collar rim",
    };
  }

  // Left Arm / Sleeve variations
  if (
    combined.includes("left") ||
    combined.includes("sleeve_l") ||
    combined.includes("l_sleeve") ||
    combined.includes("arm_l") ||
    combined.includes("l_arm") ||
    combined.includes("l arm") ||
    combined.includes("shoulder_l")
  ) {
    const isTrim = combined.includes("part") || combined.includes("cuff") || combined.includes("trim");
    return {
      id: rawName,
      rawName,
      meshName,
      label: isTrim ? "Left Arm Trim / Cuff" : "Left Arm / Sleeve",
      category: "left_arm",
      cameraCommand: "left",
      originalColor,
      icon: "👈",
      description: isTrim ? "Left sleeve cuff and trim" : "Left sleeve and shoulder",
    };
  }

  // Right Arm / Sleeve variations
  if (
    combined.includes("right") ||
    combined.includes("sleeve_r") ||
    combined.includes("r_sleeve") ||
    combined.includes("arm_r") ||
    combined.includes("r_arm") ||
    combined.includes("r arm") ||
    combined.includes("arm part") ||
    combined.includes("shoulder_r")
  ) {
    const isTrim = combined.includes("part") || combined.includes("cuff") || combined.includes("trim");
    return {
      id: rawName,
      rawName,
      meshName,
      label: isTrim ? "Right Arm Trim / Cuff" : "Right Arm / Sleeve",
      category: "right_arm",
      cameraCommand: "right",
      originalColor,
      icon: "👉",
      description: isTrim ? "Right sleeve cuff and trim" : "Right sleeve and shoulder",
    };
  }

  // Back Body variations
  if (
    combined.includes("back") ||
    combined.includes("rear") ||
    combined.includes("torso_back") ||
    combined.includes("body_back")
  ) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Back Body",
      category: "back",
      cameraCommand: "back",
      originalColor,
      icon: "🔄",
      description: "Back of the shirt",
    };
  }

  // Dedicated Logo Variations
  if (combined.includes("logo")) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Chest Logo / Badge",
      category: "front",
      cameraCommand: "front",
      originalColor,
      icon: "⭐",
      description: "Front logo and emblem section",
    };
  }

  // Dedicated Number Variations
  if (combined.includes("number")) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Jersey Number Area",
      category: "front",
      cameraCommand: "front",
      originalColor,
      icon: "🔢",
      description: "Jersey number section",
    };
  }

  // Dedicated Text Variations
  if (combined.includes("text")) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Graphic / Text Detail",
      category: "front",
      cameraCommand: "front",
      originalColor,
      icon: "🔤",
      description: "Graphic text detail section",
    };
  }

  // Front Body variations
  if (
    combined.includes("front") ||
    combined.includes("chest") ||
    combined.includes("torso_front") ||
    combined.includes("body_front")
  ) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Front Body",
      category: "front",
      cameraCommand: "front",
      originalColor,
      icon: "👕",
      description: "Front chest and torso area",
    };
  }

  // Shorts / Bottom variations
  if (combined.includes("short") || combined.includes("pant") || combined.includes("bottom")) {
    return {
      id: rawName,
      rawName,
      meshName,
      label: "Shorts / Bottom",
      category: "other",
      cameraCommand: "front",
      originalColor,
      icon: "🩳",
      description: "Shorts / lower garment part",
    };
  }

  // Clean fallback label (always has cameraCommand: "front" so camera ALWAYS moves to it!)
  const cleaned = (meshName || rawName)
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: rawName,
    rawName,
    meshName,
    label: cleaned,
    category: "other",
    cameraCommand: "front",
    originalColor,
    icon: "✨",
    description: `Variation (${rawName})`,
  };
}
