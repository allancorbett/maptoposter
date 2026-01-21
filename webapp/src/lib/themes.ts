export interface RoadColors {
  motorway: string;
  primary: string;
  secondary: string;
  tertiary: string;
  residential: string;
}

export interface Theme {
  name: string;
  bg: string;
  text: string;
  water: string;
  parks: string;
  roads: RoadColors;
}

export type ThemeId =
  | 'noir'
  | 'midnight_blue'
  | 'sunset'
  | 'blueprint'
  | 'japanese_ink'
  | 'ocean'
  | 'forest'
  | 'warm_beige'
  | 'neon_cyberpunk';

export const themes: Record<ThemeId, Theme> = {
  noir: {
    name: "Noir",
    bg: "#000000",
    text: "#FFFFFF",
    water: "#0A0A0A",
    parks: "#111111",
    roads: {
      motorway: "#FFFFFF",
      primary: "#E0E0E0",
      secondary: "#B0B0B0",
      tertiary: "#808080",
      residential: "#505050"
    }
  },
  midnight_blue: {
    name: "Midnight Blue",
    bg: "#0A1628",
    text: "#D4AF37",
    water: "#061020",
    parks: "#0F2235",
    roads: {
      motorway: "#D4AF37",
      primary: "#C9A227",
      secondary: "#A8893A",
      tertiary: "#8B7355",
      residential: "#6B5B4F"
    }
  },
  sunset: {
    name: "Sunset",
    bg: "#FDF5F0",
    text: "#8B4513",
    water: "#E8D5C4",
    parks: "#F5E6D3",
    roads: {
      motorway: "#C45C3E",
      primary: "#D4714E",
      secondary: "#B8860B",
      tertiary: "#CD853F",
      residential: "#DEB887"
    }
  },
  blueprint: {
    name: "Blueprint",
    bg: "#1B3A5F",
    text: "#FFFFFF",
    water: "#152F4E",
    parks: "#1F4470",
    roads: {
      motorway: "#FFFFFF",
      primary: "#E8E8E8",
      secondary: "#C0C0C0",
      tertiary: "#A0A0A0",
      residential: "#6B8CAE"
    }
  },
  japanese_ink: {
    name: "Japanese Ink",
    bg: "#F5F5F0",
    text: "#2C2C2C",
    water: "#E8E8E0",
    parks: "#EAEAE2",
    roads: {
      motorway: "#2C2C2C",
      primary: "#404040",
      secondary: "#606060",
      tertiary: "#808080",
      residential: "#A0A0A0"
    }
  },
  ocean: {
    name: "Ocean",
    bg: "#F0F8FA",
    text: "#1A5F7A",
    water: "#B8D4E3",
    parks: "#C5E8D5",
    roads: {
      motorway: "#1A5F7A",
      primary: "#2980B9",
      secondary: "#5DADE2",
      tertiary: "#85C1E9",
      residential: "#AED6F1"
    }
  },
  forest: {
    name: "Forest",
    bg: "#1A2F1A",
    text: "#90EE90",
    water: "#0F1F0F",
    parks: "#2D4A2D",
    roads: {
      motorway: "#90EE90",
      primary: "#7CCD7C",
      secondary: "#6B8E6B",
      tertiary: "#4A6B4A",
      residential: "#3D5C3D"
    }
  },
  warm_beige: {
    name: "Warm Beige",
    bg: "#F5F0E8",
    text: "#4A4035",
    water: "#E8DFD0",
    parks: "#EBE5D8",
    roads: {
      motorway: "#4A4035",
      primary: "#5C5045",
      secondary: "#7A6E5D",
      tertiary: "#9A8E7D",
      residential: "#C5B8A5"
    }
  },
  neon_cyberpunk: {
    name: "Cyberpunk",
    bg: "#0D0D1A",
    text: "#FF00FF",
    water: "#0A0A15",
    parks: "#1A0A2E",
    roads: {
      motorway: "#FF00FF",
      primary: "#00FFFF",
      secondary: "#FF6EC7",
      tertiary: "#7B68EE",
      residential: "#4A4A6A"
    }
  }
};

export const themeIds = Object.keys(themes) as ThemeId[];
