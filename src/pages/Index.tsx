import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Shield, 
  Trophy, 
  Users, 
  Wallet, 
  Clock,
  ArrowRight,
  Star,
  TrendingUp,
  Timer,
  Flame,
  Target,
  Sparkles,
  CircleDot
} from "lucide-react";

const games = [
  {
    id: 1,
    name: "Color Prediction",
    description: "Predict Red, Green, or Violet and win up to 4.5x your bet",
    icon: CircleDot,
    multiplier: "Up to 4.5x",
    duration: "1-5 min rounds",
    color: "from-game-red via-game-green to-game-violet",
    popular: true,
  },
  {
    id: 2,
    name: "Fast Parity",
    description: "Quick 30-second rounds for instant wins and rapid gameplay",
    icon: Zap,
    multiplier: "2x",
    duration: "30 sec rounds",
    color: "from-yellow-500 to-orange-500",
    popular: false,
  },
  {
    id: 3,
    name: "Big/Small",
    description: "Predict if the number will be big (5-9) or small (0-4)",
    icon: Target,
    multiplier: "2x",
    duration: "1 min rounds",
    color: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    id: 4,
    name: "Dice Roll",
    description: "Predict the dice outcome and multiply your winnings",
    icon: Sparkles,
    multiplier: "Up to 6x",
    duration: "1 min rounds",
    color: "from-purple-500 to-pink-500",
    popular: true,
  },
  {
    id: 5,
    name: "Number Guess",
    description: "Pick the winning number from 0-9 for massive payouts",
    icon: Timer,
    multiplier: "Up to 9x",
    duration: "3 min rounds",
    color: "from-emerald-500 to-teal-500",
    popular: false,
  },
  {
    id: 6,
    name: "Lucky Spin",
    description: "Spin the wheel and win exciting prizes and bonuses",
    icon: Flame,
    multiplier: "Up to 10x",
    duration: "Instant",
    color: "from-rose-500 to-red-500",
    popular: true,
  },
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "1-minute, 3-minute, and 5-minute game modes for quick wins"
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    description: "Admin-controlled results with full transparency"
  },
  {
    icon: Wallet,
    title: "Easy Payments",
    description: "Instant deposits and fast withdrawals via Razorpay"
  },
  {
    icon: Users,
    title: "Referral Rewards",
    description: "Earn ₹100 for every friend you bring to the platform"
  }
];

const stats = [
  { value: "50K+", label: "Active Players" },
  { value: "₹10Cr+", label: "Won by Players" },
  { value: "1M+", label: "Games Played" },
  { value: "99.9%", label: "Uptime" }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-game-violet/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">G</span>
          </div>
          <span className="font-bold text-xl text-foreground">GenXWIN</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8"
          >
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-muted-foreground">India's #1 Prediction Gaming Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-foreground">Predict Colors.</span>
            <br />
            <span className="text-gradient">Win Big.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Join thousands of players predicting Red, Green, or Violet. 
            Simple gameplay, instant payouts, and exciting rewards await you!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary text-lg px-8 h-14">
                Start Playing Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/game">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary text-lg px-8 h-14">
                <Clock className="mr-2 w-5 h-5" />
                Watch Live Games
              </Button>
            </Link>
          </motion.div>

          {/* Color Pills Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 mb-20"
          >
            {[
              { color: "bg-game-red", delay: 0 },
              { color: "bg-game-green", delay: 0.1 },
              { color: "bg-game-violet", delay: 0.2 }
            ].map((item, index) => (
              <motion.div
                key={index}
                animate={{ 
                  y: [0, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: item.delay,
                  ease: "easeInOut"
                }}
                className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl ${item.color} shadow-lg`}
                style={{
                  boxShadow: `0 10px 40px hsl(var(--${item.color.replace('bg-', '')}) / 0.4)`
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <div key={index} className="game-card p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Games Section */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Popular Games</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Game
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Multiple exciting games with different odds and payouts. Pick your favorite and start winning!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <Link to="/game">
                <div className="game-card p-6 h-full hover:border-primary/50 transition-all duration-300 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Popular badge */}
                  {game.popular && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <game.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-2">{game.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{game.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">{game.multiplier}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{game.duration}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              Play All Games
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-card/50 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Why Players Love Us
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the thrill of prediction gaming with our premium features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card p-6 hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Start Winning in 3 Steps
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Sign Up", desc: "Create your account in seconds with phone or email" },
            { step: "02", title: "Add Funds", desc: "Deposit instantly via Razorpay - UPI, Cards, Wallets" },
            { step: "03", title: "Predict & Win", desc: "Choose Red, Green, or Violet and win up to 4.5x!" }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className="text-8xl font-bold text-secondary mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
              {index < 2 && (
                <div className="hidden md:block absolute top-12 right-0 translate-x-1/2">
                  <ArrowRight className="w-8 h-8 text-border" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="game-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="relative z-10">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Test Your Luck?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of winners today. Start with as little as ₹10 and 
                experience the thrill of color prediction gaming!
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary text-lg px-12 h-14">
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="font-bold text-foreground">GenXWIN</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
              <span>Contact Us</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 GenXWIN. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
