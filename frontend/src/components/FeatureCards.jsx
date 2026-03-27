// src/components/FeatureCards.jsx
import { motion } from "framer-motion";
import { Zap, Shield, Clock } from "lucide-react";

const featureCardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const features = [
  {
    icon: Zap,
    label: "Instant",
    sub: "Fast prints",
    iconBg: "bg-muted",
    iconColor: "text-foreground",
    animation: { rotate: [0, 5, -5, 0] },
    animDuration: 2,
  },
  {
    icon: Shield,
    label: "Secure",
    sub: "Protected",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    animation: { scale: [1, 1.1, 1] },
    animDuration: 2,
  },
  {
    icon: Clock,
    label: "24/7",
    sub: "Always on",
    iconBg: "bg-white/5",
    iconColor: "text-white/70",
    animation: { rotate: [0, 360] },
    animDuration: 20,
  },
];

export default function FeatureCards() {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.5 },
        },
      }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-4"
    >
      {features.map((f) => (
        <motion.div
          key={f.label}
          variants={featureCardVariants}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="bg-card/60 backdrop-blur-md border border-border rounded-xl p-4 text-center hover:bg-card/80 transition-colors duration-200 cursor-pointer"
        >
          <motion.div
            animate={f.animation}
            transition={{
              duration: f.animDuration,
              repeat: Infinity,
              ease: f.animDuration === 20 ? "linear" : "easeInOut",
            }}
            className={`inline-flex items-center justify-center w-12 h-12 ${f.iconBg} rounded-lg mb-3`}
          >
            <f.icon className={`w-6 h-6 ${f.iconColor}`} />
          </motion.div>
          <p className="text-sm font-medium text-foreground">{f.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{f.sub}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
