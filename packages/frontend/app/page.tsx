"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";
import { useAuth } from "@/components/providers/auth-provider";
import { PublicNavbar } from "@/components/public-navbar";
import { CawStatusPanel } from "@/components/caw-status-panel";
import {
  Code,
  FileText,
  Globe,
  ShoppingBag,
  ArrowRight,
  Zap,
  Shield,
  Bot,
  Layers,
  CircleDollarSign,
  ExternalLink,
  Quote,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <PublicNavbar />

      {/* CAW Status Panel — visible at top of page */}
      <div id="caw-wallet" className="max-w-5xl mx-auto px-6 pt-4 scroll-mt-28">
        <CawStatusPanel />
      </div>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-28 overflow-hidden">
        {/* Soft glow backgrounds */}
        <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-sp-pink/10 blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute top-40 right-[15%] w-48 h-48 rounded-full bg-sp-blue/10 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-10 left-[30%] w-56 h-56 rounded-full bg-sp-gold/10 blur-3xl animate-float-slow pointer-events-none" style={{ animationDelay: "4s" }} />

        {/* Flying logo coins — smooth floating */}
        <Image src="/logo.png" alt="" width={80} height={80} className="absolute top-28 left-[3%] w-20 h-20 object-contain opacity-15 coin-float-1 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={112} height={112} className="absolute top-[60%] left-[7%] w-28 h-28 object-contain opacity-10 coin-float-3 pointer-events-none select-none hidden lg:block" />
        <Image src="/logo.png" alt="" width={96} height={96} className="absolute top-24 right-[4%] w-24 h-24 object-contain opacity-15 coin-float-2 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={64} height={64} className="absolute top-[55%] right-[6%] w-16 h-16 object-contain opacity-20 coin-float-4 pointer-events-none select-none hidden md:block" />
        <Image src="/logo.png" alt="" width={56} height={56} className="absolute bottom-24 right-[20%] w-14 h-14 object-contain opacity-8 coin-float-1 pointer-events-none select-none hidden lg:block" />
        <Image src="/logo.png" alt="" width={48} height={48} className="absolute bottom-36 left-[18%] w-12 h-12 object-contain opacity-8 coin-float-2 pointer-events-none select-none hidden lg:block" />

        <div className="max-w-5xl mx-auto text-center space-y-8 px-4">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
            <Zap className="h-4 w-4" />
            AgentPay &middot; AI-Powered Escrow Marketplace
          </div>

          {/* Logo */}
          <div className="animate-fade-in-up animate-fade-in-up-1 flex justify-center">
            <img
              src="/logo.png"
              alt="AgentPay"
              className="h-28 md:h-36 w-auto drop-shadow-lg"
            />
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up animate-fade-in-up-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
            AI-Powered Escrow{" "}
            <span className="gradient-text">Marketplace.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animate-fade-in-up-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Buy and sell digital resources with Cobo Agentic Wallet, Pact policies,
            and trustless escrow on Ethereum Sepolia.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up animate-fade-in-up-4 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard/resources/new"
                className="shimmer-btn px-8 py-4 text-white rounded-full font-bold text-lg flex items-center gap-2"
              >
                Start Creating <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <WalletConnect />
            )}
            <Link
              href="/explore"
              className="px-8 py-4 bg-card text-foreground border border-border rounded-full font-bold text-lg hover:border-primary/30 transition-all flex items-center gap-2 glow-border"
            >
                Explore Marketplace
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up animate-fade-in-up-5 flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Shield className="h-4 w-4 text-sp-blue" /> Cobo Agentic Wallet
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="h-4 w-4 text-sp-gold" /> Pact Policy Enforcement
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Bot className="h-4 w-4 text-sp-pink" /> Trustless Escrow
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold">Three steps. That&apos;s it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Create */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">01</div>
              <div className="size-14 rounded-2xl bg-sp-blue/15 text-sp-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Create</h3>
              <p className="text-muted-foreground leading-relaxed">List your digital resources with CAW-powered payment and escrow.</p>
            </div>

            {/* Step 2: Share */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">02</div>
              <div className="size-14 rounded-2xl bg-sp-pink/15 text-sp-pink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ExternalLink className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Share</h3>
              <p className="text-muted-foreground leading-relaxed">Share your AgentPay link. Buyers pay through CAW with Pact policy enforcement.</p>
            </div>

            {/* Step 3: Earn */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 glow-border relative">
              <div className="text-6xl font-bold text-border group-hover:text-primary/10 transition-colors absolute top-6 right-8">03</div>
              <div className="size-14 rounded-2xl bg-sp-gold/15 text-sp-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CircleDollarSign className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Earn</h3>
              <p className="text-muted-foreground leading-relaxed">Escrow releases funds on delivery. Protected by Pact policies on Sepolia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES BENTO GRID
          ============================================ */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">What You Can Trade</p>
            <h2 className="text-4xl md:text-5xl font-bold">Digital resources. Protected by code.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* API Proxy — large card */}
            <div className="group p-8 md:p-10 rounded-3xl bg-card border border-border hover:border-sp-blue/30 transition-all duration-300 glow-border row-span-2 flex flex-col justify-between">
              <div>
                <div className="size-14 rounded-2xl bg-sp-blue/15 text-sp-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Digital Resources</h3>
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  List APIs, files, datasets, or services. Buyers pay via CAW with automated escrow release on delivery.
                </p>
              </div>
              <div className="bg-secondary rounded-2xl p-5 font-mono text-sm overflow-x-auto">
                <div className="text-muted-foreground">
                  <span className="text-sp-blue">GET</span> /api/resource/:id
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="text-sp-pink">CAW</span> Pact Check
                </div>
                <div className="text-muted-foreground mt-1">
                  <span className="text-sp-gold">ESCROW:</span> Lock + Deliver + Release
                </div>
                <div className="text-sp-blue mt-1">
                  <span className="text-green-500">✅</span> Trustless Settlement
                </div>
              </div>
            </div>

            {/* Files & Downloads */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-sp-pink/30 transition-all duration-300 glow-border">
              <div className="size-14 rounded-2xl bg-sp-pink/15 text-sp-pink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7" />
              </div>
                <h3 className="text-2xl font-bold mb-3">Escrow Protection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Funds locked in escrow smart contract. Released only after buyer confirms delivery. No trust required.
              </p>
            </div>

            {/* Articles */}
            <div className="group p-8 rounded-3xl bg-card border border-border hover:border-sp-gold/30 transition-all duration-300 glow-border">
              <div className="size-14 rounded-2xl bg-sp-gold/15 text-sp-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="h-7 w-7" />
              </div>
                <h3 className="text-2xl font-bold mb-3">Pact Policies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Buyer, Seller, and Settler policies enforced by Cobo Agentic Wallet. Block malicious transactions automatically.
              </p>
            </div>

            {/* Shopify — full width */}
            <div className="group p-8 md:p-10 rounded-3xl bg-card border border-border hover:border-sp-coral/30 transition-all duration-300 glow-border md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-1">
                  <div className="size-14 rounded-2xl bg-sp-coral/15 text-sp-coral flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">AI Agent Ready</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    Agents browse, pay, and receive resources through MCP + A2A protocols. Cobo Agentic Wallet handles all payments.
                  </p>
                </div>
                <div className="flex-shrink-0 bg-secondary rounded-2xl p-6 space-y-3 min-w-[280px]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CAW Wallet</span>
                    <span className="font-bold text-sp-blue">Cobo MPC</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pact Policy</span>
                    <span className="font-bold text-sp-pink">Buyer/Seller/Settler</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Escrow</span>
                    <span className="font-bold text-sp-gold">Trustless Release</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          BUILT FOR AI AGENTS
          ============================================ */}
      <section className="py-24 px-6 bg-secondary relative overflow-hidden" id="ai">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">AI-Native Escrow</p>
            <h2 className="text-4xl md:text-6xl font-bold">
              Trustless Commerce for{" "}
              <span className="gradient-text">AI Agents</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI agents buy and sell resources with Cobo Agentic Wallet. Pact policies enforce rules,
              escrow protects both sides. Fully autonomous commerce.
            </p>
          </div>

          {/* Protocol badges */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "CAW", desc: "Cobo Agentic Wallet" },
              { label: "MCP", desc: "Model Context" },
              { label: "A2A", desc: "Agent-to-Agent" },
              { label: "Pact", desc: "Policy Enforcement" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="px-6 py-3 rounded-2xl bg-card border border-border text-center glow-border"
              >
                <p className="font-bold text-lg">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            ))}
          </div>

          {/* Code snippet showing escrow flow */}
          <div className="max-w-2xl mx-auto bg-card rounded-3xl border border-border p-6 md:p-8 text-left overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-sp-coral/60" />
              <div className="w-3 h-3 rounded-full bg-sp-gold/60" />
              <div className="w-3 h-3 rounded-full bg-sp-blue/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">escrow-flow.ts</span>
            </div>
            <pre className="!bg-transparent !border-0 !p-0 text-sm leading-relaxed">
              <code className="!text-foreground">{`// AI Agent Escrow Flow
// 1. Buyer finds resource → initiates purchase
const order = await api.createOrder(resourceId);

// 2. CAW checks Pact policies
const check = await caw.checkPolicy(order);
// → Approved ✅ or Blocked ❌

// 3. Funds locked in escrow contract
const escrow = await escrow.lock(order.total);

// 4. Seller delivers → buyer confirms
await escrow.release(escrow.id);

// 5. Funds released to seller ✓
console.log("Trustless settlement complete");`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-primary font-bold tracking-widest uppercase text-sm">Creators Love It</p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Don&apos;t take our word for it
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-pink/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;CAW Pact policies blocked a malicious buyer trying to drain funds. The escrow system saved me $5K in the first week. Trustless commerce is the future.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-blue/20 text-sp-blue flex items-center justify-center font-bold text-sm shrink-0">MR</div>
                <div>
                  <p className="font-bold text-sm">Alex C.</p>
                  <p className="text-xs text-muted-foreground">AI Agent Developer &middot; SF, CA</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-blue/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;Our AI marketplace uses AgentPay for all transactions. 3 Pact policies ensure buyers, sellers, and settlers are all protected. Zero disputes so far.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-pink/20 text-sp-pink flex items-center justify-center font-bold text-sm shrink-0">SK</div>
                <div>
                  <p className="font-bold text-sm">Priya M.</p>
                  <p className="text-xs text-muted-foreground">Marketplace Founder &middot; Singapore</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-3xl bg-card border border-border glow-border relative flex flex-col">
              <Quote className="h-8 w-8 text-sp-gold/30 mb-4" />
              <p className="text-foreground leading-relaxed flex-1">
                &ldquo;Cobo Agentic Wallet + Pact policies = autonomous commerce. Our AI agent buys training data, pays via CAW, and escrow releases on delivery. Fully automated.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="size-10 rounded-full bg-sp-gold/20 text-sp-gold flex items-center justify-center font-bold text-sm shrink-0">JL</div>
                <div>
                  <p className="font-bold text-sm">James L.</p>
                  <p className="text-xs text-muted-foreground">AI Research Lab &middot; London, UK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SCROLLING MARQUEE
          ============================================ */}
      <section className="py-8 overflow-hidden border-y border-border bg-secondary/50">
        <div className="marquee-track">
          {/* Doubled for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {[
                "API Developers",
                "Content Creators",
                "AI Agent Builders",
                "Newsletter Writers",
                "Data Scientists",
                "SaaS Founders",
                "Shopify Sellers",
                "Indie Hackers",
                "Researchers",
                "Digital Artists",
                "Open Source Devs",
                "Course Creators",
              ].map((item) => (
                <span key={item} className="text-lg font-bold text-muted-foreground/40 whitespace-nowrap px-4">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          TRUST / POWERED BY
          ============================================ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[
              "Cobo Agentic Wallet",
              "Pact Policies",
              "Trustless Escrow",
              "Ethereum Sepolia",
              "AI-Native",
              "MCP + A2A",
              "Autonomous Commerce",
            ].map((badge) => (
              <div
                key={badge}
                className="px-5 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sp-blue/5 via-sp-pink/5 to-sp-gold/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold">
            Start trading with{" "}
            <span className="gradient-text">AgentPay</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Connect your CAW wallet, create a listing, and let Pact policies protect every transaction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard/resources/new"
                className="shimmer-btn px-10 py-5 text-white rounded-full font-bold text-lg flex items-center gap-2"
              >
                Create Your First Listing <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="AgentPay" width={40} height={40} className="h-10 w-auto" />
                <span className="text-xl font-bold tracking-tight">AgentPay</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                AI-Powered Escrow Marketplace with Cobo Agentic Wallet. Built for AI × Web3 Agentic Builders Hackathon.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sp-blue/10 text-sp-blue text-xs font-bold">
                Track 1: Cobo Agentic Wallet
              </div>
            </div>
            <div className="space-y-5">
              <h6 className="font-bold text-foreground">Platform</h6>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/explore" className="hover:text-primary transition-colors">Explore</Link></li>
                <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="/creators" className="hover:text-primary transition-colors">Creators</Link></li>
              </ul>
            </div>
            <div className="space-y-5">
              <h6 className="font-bold text-foreground">Resources</h6>
              <ul className="space-y-3 text-muted-foreground font-medium">
                <li><Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link></li>
                <li><Link href="/faucet" className="hover:text-primary transition-colors">Faucet</Link></li>
                <li><Link href="/docs" className="hover:text-primary transition-colors">API Reference</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">&copy; 2026 AgentPay. All rights reserved.</p>
            <p className="text-muted-foreground text-sm font-medium">Powered by Cobo Agentic Wallet · Built for AI × Web3 Agentic Builders Hackathon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
