import numpy as np
import pandas as pd
from typing import Dict, List
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import squareform
from quant_engine.interfaces.base import IPortfolioAllocator

class HRPAllocator(IPortfolioAllocator):
    """
    Hierarchical Risk Parity: 
    1. Distance matrix from correlation.
    2. Agglomerative clustering.
    3. Quasi-diagonalization.
    4. Recursive bisection.
    
    Robust to ill-conditioned covariance matrices unlike Markowitz Mean-Variance Optimization.
    """
    
    def _get_distance_matrix(self, corr: pd.DataFrame) -> pd.DataFrame:
        """Distance based on Information Theory (sqrt(0.5*(1-rho)))"""
        return np.sqrt(0.5 * (1 - corr))
        
    def _get_quasi_diag(self, link: np.ndarray) -> List[int]:
        """Recursive sort of hierarchical tree to group similar assets together."""
        link = link.astype(int)
        sort_ix = pd.Series([link[-1, 0], link[-1, 1]])
        num_items = link[-1, 3]
        
        while sort_ix.max() >= num_items:
            sort_ix.index = range(0, sort_ix.shape[0] * 2, 2)
            df0 = sort_ix[sort_ix >= num_items]
            i = df0.index
            j = df0.values - num_items
            sort_ix[i] = link[j, 0] # Item 1
            df0 = pd.Series(link[j, 1], index=i + 1) # Item 2
            sort_ix = sort_ix.append(df0)
            sort_ix = sort_ix.sort_index()
            sort_ix.index = range(sort_ix.shape[0])
            
        return sort_ix.tolist()
        
    def _get_cluster_var(self, cov: pd.DataFrame, c_items: List[int]) -> float:
        """Inverse variance weighting variance of a cluster"""
        cov_slice = cov.iloc[c_items, c_items]
        ivp = 1. / np.diag(cov_slice)
        ivp /= ivp.sum()
        w = ivp.reshape(-1, 1)
        return np.dot(np.dot(w.T, cov_slice), w)[0, 0]
        
    def _get_rec_bipart(self, cov: pd.DataFrame, sort_ix: List[int]) -> pd.Series:
        """Compute HRP allocations recursively down the tree."""
        w = pd.Series(1, index=sort_ix)
        c_items = [sort_ix]
        
        while len(c_items) > 0:
            c_items = [i[j:k] for i in c_items for j, k in ((0, len(i) // 2), (len(i) // 2, len(i))) if len(i) > 1]
            for i in range(0, len(c_items), 2):
                c_items0 = c_items[i] # First half
                c_items1 = c_items[i + 1] # Second half
                
                c_var0 = self._get_cluster_var(cov, c_items0)
                c_var1 = self._get_cluster_var(cov, c_items1)
                
                alpha = 1 - c_var0 / (c_var0 + c_var1)
                
                w[c_items0] *= alpha
                w[c_items1] *= 1 - alpha
                
        return w
        
    def allocate(self, predictions: Dict[str, float], 
               covariance: pd.DataFrame, 
               regime: int) -> Dict[str, float]:
        """
        Combines directional signal with HRP base weights.
        If signal is > 0, goes long. If signal is < 0, goes short.
        """
        symbols = list(predictions.keys())
        cov = covariance.loc[symbols, symbols]
        
        # Convert covariance to correlation
        vols = np.sqrt(np.diag(cov))
        corr = cov / np.outer(vols, vols)
        corr = pd.DataFrame(corr, index=symbols, columns=symbols)
        
        # 1. Clustering
        dist = self._get_distance_matrix(corr)
        # Using ward linkage instead of single linkage for stability
        link = linkage(squareform(dist), method='ward')
        
        # 2. Quasi-diagonalization
        sort_ix = self._get_quasi_diag(link)
        
        # 3. Recursive bisection for base weights
        hrp_weights = self._get_rec_bipart(cov, sort_ix)
        hrp_weights.index = [symbols[i] for i in hrp_weights.index]
        
        # Combine base risk weights with directional conviction
        target_weights = {}
        for sym in symbols:
            direction = np.sign(predictions[sym])
            magnitude = np.abs(predictions[sym])
            # Scale HRP weight by conviction
            target_weights[sym] = hrp_weights[sym] * direction * magnitude
            
        # Normalize sum of absolute weights to 1 (full investment)
        total = sum(abs(w) for w in target_weights.values())
        if total > 0:
            target_weights = {k: v / total for k, v in target_weights.items()}
            
        return target_weights
