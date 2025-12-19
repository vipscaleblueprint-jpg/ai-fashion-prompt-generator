import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Sparkles, Zap, Layers, Wand2 } from "lucide-react";

export default function Index() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden selection:bg-primary/20">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-primary shadow-sm mb-6 hover:bg-accent/50 transition-colors">
                <Sparkles className="w-4 h-4 mr-2 text-secondary" />
                <span>Next-Gen Fashion AI Prompting</span>
              </div>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Transform Ideas into <br className="hidden md:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-secondary animate-gradient-x">
                Fashion Masterpieces
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              The ultimate tool for fashion designers and AI artists. Generate professional, detailed prompts for Midjourney and Stable Diffusion in seconds.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
              <Link to="/generate" className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto rounded-full group">
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold border-2 hover:bg-accent/50 w-full sm:w-auto rounded-full backdrop-blur-sm bg-background/50">
                  How it Works
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30 relative">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to bridge the gap between creative vision and AI generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: "Visual Analysis",
                desc: "Upload any reference image and let our AI extract style, fabric, and lighting details instantly.",
                color: "text-blue-500",
                bg: "bg-blue-500/10"
              },
              {
                icon: Layers,
                title: "Smart Terminology",
                desc: "Automatically translates visual elements into industry-standard fashion photography vocabulary.",
                color: "text-purple-500",
                bg: "bg-purple-500/10"
              },
              {
                icon: Wand2,
                title: "Instant Generation",
                desc: "Get production-ready prompts optimized for the latest AI models like Midjourney v6.",
                color: "text-amber-500",
                bg: "bg-amber-500/10"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative p-8 bg-card/50 backdrop-blur-xl rounded-3xl border border-white/20 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-card/20 dark:border-white/10"
              >
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section className="py-24 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                From Concept to <span className="text-secondary">Reality</span>
              </h2>
              <div className="space-y-6">
                {[
                  "Precise fabric texture & drape descriptions",
                  "Professional studio lighting terminology",
                  "Cinematic composition & camera angles",
                  "Color grading and mood enhancement"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-lg font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/generate">
                <Button className="mt-4 h-12 px-8 rounded-full text-base" size="lg">
                  Try the Magic
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              {/* Decorative elements behind image */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-[2rem] blur-xl opacity-70" />

              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-[4/3] bg-muted group">
                <img
                  src="/imagepreview.png"
                  alt="Interface Preview"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating UI Card Overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-medium uppercase tracking-wider text-white/70">Generated Prompt</span>
                  </div>
                  <p className="text-sm font-light text-white/90 line-clamp-2">
                    "High fashion photography, silk satin dress in emerald green, dramatic chiaroscuro lighting, 85mm lens..."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-secondary to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="container px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Ready to Upgrade Your Workflow?
            </h2>
            <p className="text-primary-foreground/80 text-xl leading-relaxed">
              Join thousands of creators who are saving hours of prompting time.
            </p>
            <Link to="/generate" className="inline-block w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl hover:shadow-white/10 hover:scale-105 transition-all w-full sm:w-auto">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
