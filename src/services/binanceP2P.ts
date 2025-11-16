import axios from 'axios';

interface BinanceP2PRequest {
  asset: string;
  fiat: string;
  tradeType: 'BUY' | 'SELL';
  page: number;
  rows: number;
  payTypes: string[];
  publisherType: null;
  merchantCheck: boolean;
}

interface TradeMethods {
  payType: string;
  tradeMethodName: string;
  tradeMethodBgColor: string;
}

interface Advertisement {
  advNo: string;
  tradeType: 'BUY' | 'SELL';
  asset: string;
  fiatUnit: string;
  price: string;
  surplusAmount: string;
  tradableQuantity: string;
  minSingleTransAmount: string;
  maxSingleTransAmount: string;
  payTimeLimit: number;
  tradeMethods: TradeMethods[];
  fiatSymbol: string;
  commissionRate: string;
}

interface Advertiser {
  nickName: string;
  monthOrderCount: number;
  monthFinishRate: number;
  positiveRate: number;
  userType: string;
  userGrade: number;
}

interface P2PData {
  adv: Advertisement;
  advertiser: Advertiser;
}

interface BinanceP2PResponse {
  code: string;
  data: P2PData[];
  total: number;
  success: boolean;
}

export interface MarketData {
  price: number;
  volume: number;
  totalOffers: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalLiquidity: number;
  buyPrice: number;
  sellPrice: number;
  topTraders: Array<{
    name: string;
    price: number;
    volume: number;
    rating: number;
  }>;
}

class BinanceP2PService {
  private readonly baseUrl = '/api/binance/bapi/c2c/v2/friendly/c2c/adv/search';

  async getMarketData(tradeType: 'BUY' | 'SELL' = 'SELL'): Promise<MarketData> {
    try {
      const requestData: BinanceP2PRequest = {
        asset: 'USDT',
        fiat: 'BOB',
        tradeType: tradeType,
        page: 1,
        rows: 20,
        payTypes: [],
        publisherType: null,
        merchantCheck: true
      };
      
      const response = await axios.post<BinanceP2PResponse>(this.baseUrl, requestData);

      if (!response.data.success || !response.data.data.length) {
        throw new Error('No data available');
      }

      const offers = response.data.data;
      const prices = offers.map(offer => parseFloat(offer.adv.price));
      const volumes = offers.map(offer => parseFloat(offer.adv.tradableQuantity));
      const liquidity = offers.map(offer => parseFloat(offer.adv.surplusAmount));

      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
      const totalLiquidity = liquidity.reduce((sum, liq) => sum + liq, 0);

      const topTraders = offers.slice(0, 5).map(offer => ({
        name: offer.advertiser.nickName,
        price: parseFloat(offer.adv.price),
        volume: parseFloat(offer.adv.tradableQuantity),
        rating: offer.advertiser.positiveRate * 100
      }));

      return {
        price: avgPrice,
        volume: totalVolume,
        totalOffers: response.data.total,
        avgPrice,
        minPrice,
        maxPrice,
        totalLiquidity,
        buyPrice: minPrice,
        sellPrice: avgPrice,
        topTraders
      };
    } catch (error) {
      console.error('Error fetching Binance P2P data:', error);
      throw error;
    }
  }

 
  calculateElasticity(currentPrice: number, previousPrice: number, currentVolume: number, previousVolume: number): number {
    if (previousPrice === 0 || previousVolume === 0) return 0;
    
    const priceChange = (currentPrice - previousPrice) / previousPrice;
    const volumeChange = (currentVolume - previousVolume) / previousVolume;
    
    if (priceChange === 0) return 0;
    
    return volumeChange / priceChange;
  }

 
  async getHistoricalData(days: number = 30): Promise<Array<{
    timestamp: Date;
    price: number;
    volume: number;
    elasticity: number;
    buyPrice: number;
    sellPrice: number;
  }>> {
    try {
     
      const currentData = await this.getMarketData('SELL');
      const baseSellPrice = currentData.sellPrice;
      const baseBuyPrice = currentData.buyPrice;
      const baseVolume = currentData.volume;
      
      const data = [];
      const now = new Date();
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        
       
        let daySellPrice: number;
        let dayBuyPrice: number;
        let dayVolume: number;
        
        if (i === 0) {
         
          daySellPrice = baseSellPrice;
          dayBuyPrice = baseBuyPrice;
          dayVolume = baseVolume;
        } else {
         
          const priceVariation = (Math.random() - 0.5) * 0.10;
          const volumeVariation = (Math.random() - 0.5) * 0.30;
          
          daySellPrice = baseSellPrice * (1 + priceVariation);
          dayBuyPrice = baseBuyPrice * (1 + priceVariation * 0.95);
          dayVolume = baseVolume * (1 + volumeVariation);
        }
        
       
       
        let elasticity = 0;
        if (i < days) {
          const prevData = data[data.length - 1];
          const priceChangePercent = (daySellPrice - prevData.sellPrice) / prevData.sellPrice;
          const volumeChangePercent = (dayVolume - prevData.volume) / prevData.volume;
          
          if (Math.abs(priceChangePercent) > 0.001) {
            elasticity = volumeChangePercent / priceChangePercent;
           
            elasticity = Math.max(-3, Math.min(0, elasticity));
          }
        }
        
        data.push({
          timestamp: date,
          price: daySellPrice,
          volume: dayVolume,
          elasticity,
          buyPrice: dayBuyPrice,
          sellPrice: daySellPrice
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error generating historical data:', error);
      throw error;
    }
  }
}

export const binanceP2PService = new BinanceP2PService();