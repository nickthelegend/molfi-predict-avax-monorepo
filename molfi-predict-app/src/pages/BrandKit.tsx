import { motion } from "framer-motion";
import { Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useTheme } from "@/providers/ThemeProvider";
import { brand, getThemedLogo, getThemedIcon, logoDark, logoLight, logoIconDark, logoIconLight } from "@/config/brand";

const BrandKit = () => {
  const { theme, resolvedTheme } = useTheme();
  
  const downloadAsset = (src: string, filename: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    link.click();
  };

  const logoAssets = [
    {
      title: "Full Logo - Light Theme",
      description: "Black logo for light backgrounds",
      src: logoLight,
      filename: "molfi-logo-light.png",
      bgClass: "bg-white",
    },
    {
      title: "Full Logo - Dark Theme",
      description: "White logo for dark backgrounds",
      src: logoDark,
      filename: "molfi-logo-dark.png",
      bgClass: "bg-zinc-900",
    },
  ];

  const iconAssets = [
    {
      title: "Logo Icon - Light Theme",
      description: "Black icon for light backgrounds",
      src: logoIconLight,
      filename: "molfi-icon-light.png",
      bgClass: "bg-white",
    },
    {
      title: "Logo Icon - Dark Theme",
      description: "White icon for dark backgrounds",
      src: logoIconDark,
      filename: "molfi-icon-dark.png",
      bgClass: "bg-zinc-900",
    },
  ];

  const colors = [
    { name: "Primary Cyan", hex: "#00c9ff", usage: "Main brand color, CTAs" },
    { name: "Accent", hex: "#00c9ff", usage: "Accents, hover states" },
    { name: "Success Green", hex: "#10b981", usage: "Positive actions, YES outcomes" },
    { name: "Destructive Red", hex: "#ef4444", usage: "Negative actions, NO outcomes" },
  ];

  const guidelines = {
    dos: [
      "Use the appropriate logo variant based on background color",
      "Maintain clear space around the logo equal to the height of the icon",
      "Use official brand colors from the palette",
      "Scale the logo proportionally",
    ],
    donts: [
      "Don't rotate or skew the logo",
      "Don't change the logo colors",
      "Don't add effects like shadows or outlines",
      "Don't place the logo on busy backgrounds",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEO 
        title="Brand Kit - Molfi"
        description="Download Molfi logos and learn about our brand guidelines"
      />

      <div className="container max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Molfi Brand Kit
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Download our logos and follow our brand guidelines to maintain consistency across all communications
          </p>
        </motion.div>

        {/* Full Logo Downloads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Full Logo</h2>
              <p className="text-sm text-muted-foreground mt-1">Complete Molfi wordmark with icon</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {logoAssets.map((asset, index) => (
                <motion.div
                  key={asset.filename}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                  className="space-y-4"
                >
                  <div className={`${asset.bgClass} rounded-lg p-8 flex items-center justify-center min-h-[160px] border border-border/50`}>
                    <img src={asset.src} alt={asset.title} className="max-w-[200px] h-auto" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{asset.title}</h3>
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                  </div>
                  <Button 
                    onClick={() => downloadAsset(asset.src, asset.filename)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Logo Icon Downloads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Logo Icon</h2>
              <p className="text-sm text-muted-foreground mt-1">Standalone icon for smaller spaces and favicons</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {iconAssets.map((asset, index) => (
                <motion.div
                  key={asset.filename}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + index * 0.1 }}
                  className="space-y-4"
                >
                  <div className={`${asset.bgClass} rounded-lg p-8 flex items-center justify-center min-h-[160px] border border-border/50`}>
                    <img src={asset.src} alt={asset.title} className="w-20 h-20 object-contain" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{asset.title}</h3>
                    <p className="text-sm text-muted-foreground">{asset.description}</p>
                  </div>
                  <Button 
                    onClick={() => downloadAsset(asset.src, asset.filename)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Brand Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Brand Colors</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {colors.map((color, index) => (
                <motion.div
                  key={color.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div 
                    className="w-16 h-16 rounded-lg shadow-lg"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{color.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{color.hex}</p>
                    <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Usage Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Usage Guidelines</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Do's */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  Do's
                </h3>
                <ul className="space-y-3">
                  {guidelines.dos.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don'ts */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                  <X className="w-5 h-5" />
                  Don'ts
                </h3>
                <ul className="space-y-3">
                  {guidelines.donts.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <X className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Additional Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 space-y-4">
            <h2 className="text-2xl font-bold">Typography</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Our primary typeface is <span className="font-semibold">Inter</span> for clean, modern readability across all platforms.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 border border-border/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Headings</p>
                  <p className="text-2xl font-bold">Aa Bb Cc</p>
                  <p className="text-sm text-muted-foreground mt-1">Inter Bold</p>
                </div>
                <div className="p-4 border border-border/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Body Text</p>
                  <p className="text-base">Aa Bb Cc</p>
                  <p className="text-sm text-muted-foreground mt-1">Inter Regular</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground">
            Need help with brand materials? Contact us at{" "}
            <a href="mailto:admin@molfi.com" className="text-primary hover:underline">
              admin@molfi.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default BrandKit;
