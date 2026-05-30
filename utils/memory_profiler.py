# Memory profiling and monitoring utility
import os
import psutil
from typing import Dict, Optional
from utils.logger import setup_logger

logger = setup_logger(__name__)


class MemoryProfiler:
    """Monitor and track memory usage"""
    
    def __init__(self):
        try:
            self.process = psutil.Process(os.getpid())
        except:
            self.process = None
            logger.warning("psutil not available for memory profiling")
        
        self.peak_memory_mb = 0
        self.memory_snapshots: Dict[str, float] = {}
        self.enabled = self.process is not None
    
    def get_memory_mb(self) -> float:
        """Get current memory usage in MB"""
        if not self.enabled:
            return 0.0
        try:
            return self.process.memory_info().rss / 1024 / 1024
        except:
            return 0.0
    
    def snapshot(self, label: str = ""):
        """Record current memory usage"""
        if not self.enabled:
            return
        
        mem_mb = self.get_memory_mb()
        self.memory_snapshots[label] = mem_mb
        
        if mem_mb > self.peak_memory_mb:
            self.peak_memory_mb = mem_mb
        
        logger.debug(f"[MEMORY] {label}: {mem_mb:.1f}MB (peak: {self.peak_memory_mb:.1f}MB)")
    
    def get_delta(self, label1: str, label2: str) -> float:
        """Get memory difference between two snapshots"""
        if label1 not in self.memory_snapshots or label2 not in self.memory_snapshots:
            return 0.0
        return self.memory_snapshots[label2] - self.memory_snapshots[label1]
    
    def report(self) -> str:
        """Get memory usage report"""
        if not self.enabled:
            return "Memory profiling disabled"
        
        current = self.get_memory_mb()
        report = f"Memory Usage: {current:.1f}MB / Peak: {self.peak_memory_mb:.1f}MB"
        
        if self.memory_snapshots:
            report += "\nSnapshots:\n"
            for label, mem in self.memory_snapshots.items():
                report += f"  {label}: {mem:.1f}MB\n"
        
        return report


# Global profiler instance
_profiler: Optional[MemoryProfiler] = None


def get_profiler() -> MemoryProfiler:
    """Get global memory profiler instance"""
    global _profiler
    if _profiler is None:
        _profiler = MemoryProfiler()
    return _profiler


def log_memory(label: str):
    """Log memory snapshot"""
    profiler = get_profiler()
    profiler.snapshot(label)
