import { useEffect, useCallback } from "react";
import { useGameStore } from "../../store/useGameStore";
import { Tile } from "./Tile";
import { motion, AnimatePresence } from "motion/react";
import { generateVictoryImage } from "../../services/geminiService";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Loader2, CheckCircle2, ExternalLink, Image as ImageIcon } from "lucide-react";

export function Board() {
  const { 
    tiles, move, gameOver, won, initGame, score,
    isProcessing, victoryImage, txHash,
    setProcessing, setVictoryImage, setTxHash 
  } = useGameStore();
  const { signAndSubmitTransaction, connected } = useWallet();

  const handleGameOver = useCallback(async () => {
    if (!gameOver || isProcessing || victoryImage) return;

    setProcessing(true);
    
    // 1. Generate AI Victory Image
    const imageUrl = await generateVictoryImage(score);
    setVictoryImage(imageUrl);

    // 2. Submit Shelby Testnet Transaction (if connected)
    if (connected) {
      try {
        const payload = {
          type: "entry_function_payload",
          function: "0x1::aptos_account::transfer",
          type_arguments: [],
          arguments: ["0x1", 100], // Simulating sending data to Shelby Protocol
        };
        const response = await signAndSubmitTransaction(payload as any);
        setTxHash(response.hash);
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }

    setProcessing(false);
  }, [gameOver, isProcessing, victoryImage, score, connected, signAndSubmitTransaction, setProcessing, setVictoryImage, setTxHash]);

  useEffect(() => {
    if (gameOver) {
      handleGameOver();
    }
  }, [gameOver, handleGameOver]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isProcessing) return;
      
      if (e.key === "ArrowUp") move("up");
      if (e.key === "ArrowDown") move("down");
      if (e.key === "ArrowLeft") move("left");
      if (e.key === "ArrowRight") move("right");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, gameOver, isProcessing]);

  return (
    <div className="relative p-2 bg-slate-900/50 rounded-xl border-2 border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      {/* Grid background */}
      <div className="grid grid-cols-4 gap-2">
        {Array(16).fill(null).map((_, i) => (
          <div key={i} className="w-20 h-20 bg-slate-800/30 rounded-lg border border-slate-700/30" />
        ))}
      </div>

      {/* Tiles */}
      <div className="absolute top-2 left-2">
        <AnimatePresence>
          {tiles.map((tile) => (
            <Tile key={tile.id} value={tile.value} position={tile.position} />
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-xl backdrop-blur-md z-10 p-6 text-center"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="text-cyan-400 font-bold animate-pulse uppercase tracking-widest text-sm">
                  Generating Victory Asset & Recording on Shelby...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full">
                <h2 className="text-4xl font-black italic text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                  GAME OVER
                </h2>
                
                {victoryImage && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative group"
                  >
                    <img 
                      src={victoryImage} 
                      alt="Victory" 
                      className="w-48 h-48 rounded-lg border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                      <ImageIcon className="text-white w-8 h-8" />
                    </div>
                  </motion.div>
                )}

                {txHash && (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono bg-cyan-950/30 px-4 py-2 rounded-lg border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <CheckCircle2 className="w-4 h-4" />
                      <div className="flex flex-col items-start">
                        <span className="text-[8px] uppercase tracking-widest text-cyan-500/60 font-black">Shelby Testnet Verified</span>
                        <span>{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                      </div>
                    </div>
                    <a 
                      href={`https://explorer.shelby.xyz/testnet/txn/${txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-2 transition-all hover:gap-3"
                    >
                      View on Shelby Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => initGame()}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-colors font-bold uppercase text-xs tracking-widest"
                  >
                    Try Again
                  </button>
                  {victoryImage && (
                    <a
                      href={victoryImage}
                      download="shelby-victory.png"
                      className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-400 transition-colors font-bold uppercase text-xs tracking-widest flex items-center gap-2"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Won Overlay */}
      <AnimatePresence>
        {won && !gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 rounded-xl backdrop-blur-sm z-10"
          >
            <h2 className="text-4xl font-bold text-emerald-400 mb-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
              YOU WON!
            </h2>
            <button
              onClick={() => initGame()}
              className="px-6 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg border border-emerald-600 transition-colors"
            >
              Keep Playing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
