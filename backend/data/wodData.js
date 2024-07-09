const wodData = [
    {
        "Cryptocurrency": {
            "word": "Cryptocurrency",
            "meaning": "A digital or virtual currency that uses cryptography for security and operates independently of a central bank.",
            "url": "https://www.investopedia.com/terms/c/cryptocurrency.asp"
        }
    },
    {
        "Blockchain": {
            "word": "Blockchain",
            "meaning": "A digital ledger of transactions that is distributed across a network of computers, making it decentralized and secure.",
            "url": "https://www.investopedia.com/terms/b/blockchain.asp"
        }
    },
    {
        "Bitcoin": {
            "word": "Bitcoin",
            "meaning": "The first and largest cryptocurrency by market cap, created in 2009 by an anonymous person or group using the pseudonym Satoshi Nakamoto.",
            "url": "https://www.investopedia.com/terms/b/bitcoin.asp"
        }
    },
    {
        "Altcoin": {
            "word": "Altcoin",
            "meaning": "Any cryptocurrency other than Bitcoin.",
            "url": "https://www.investopedia.com/terms/a/altcoin.asp"
        }
    },
    {
        "Token": {
            "word": "Token",
            "meaning": "A unit of value issued by a company or organization that can be used within its ecosystem.",
            "url": "https://www.investopedia.com/terms/t/token.asp"
        }
    },
    {
        "Mining": {
            "word": "Mining",
            "meaning": "The process of validating transactions and adding them to the blockchain in exchange for a reward, usually in the form of newly minted coins.",
            "url": "https://www.investopedia.com/terms/b/bitcoin-mining.asp"
        }
    },
    {
        "Wallet": {
            "word": "Wallet",
            "meaning": "A digital wallet that stores a user's cryptocurrencies and allows them to send and receive payments.",
            "url": "https://www.investopedia.com/terms/c/cryptocurrency-wallet.asp"
        }
    },
    {
        "Exchange": {
            "word": "Exchange",
            "meaning": "A platform where users can buy, sell, and trade cryptocurrencies.",
            "url": "https://www.investopedia.com/terms/c/currency-exchange.asp"
        }
    },
    {
        "Decentralized": {
            "word": "Decentralized",
            "meaning": "A system or organization that operates without a central authority or governing body.",
            "url": "https://www.investopedia.com/terms/d/decentralization.asp"
        }
    },
    {
        "Centralized": {
            "word": "Centralized",
            "meaning": "A system or organization that is controlled by a central authority or governing body.",
            "url": "https://www.investopedia.com/terms/c/centralization.asp"
        }
    },
    {
        "Fiat Currency": {
            "word": "Fiat Currency",
            "meaning": "A government-issued currency that is not backed by a physical commodity, such as gold or silver.",
            "url": "https://www.investopedia.com/terms/f/fiatmoney.asp"
        }
    },
    {
        "Liquidity": {
            "word": "Liquidity",
            "meaning": "The degree to which an asset or security can be bought or sold in the market without affecting its price.",
            "url": "https://www.investopedia.com/terms/l/liquidity.asp"
        }
    },
    {
        "Market Cap": {
            "word": "Market Cap",
            "meaning": "The total value of a company or cryptocurrency, calculated by multiplying the total number of outstanding shares or coins by the current market price.",
            "url": "https://www.investopedia.com/terms/m/marketcapitalization.asp"
        }
    },
    {
        "Market Order": {
            "word": "Market Order",
            "meaning": "An order to buy or sell a security at the best available price in the market.",
            "url": "https://www.investopedia.com/terms/m/marketorder.asp"
        }
    },
    {
        "Limit Order": {
            "word": "Limit Order",
            "meaning": "An order to buy or sell a security at a specified price",
            "url": "https://www.investopedia.com/terms/l/limitorderbook.asp"
        }
    },
    {
        "Stop Order": {
            "word": "Stop Order",
            "meaning": "An order to buy or sell a security once it reaches a specified price level, designed to limit potential losses or lock in profits.",
            "url": "https://www.investopedia.com/terms/s/stoporder.asp"
        }
    },
    {
        "Spread": {
            "word": "Spread",
            "meaning": "The difference between the bid price and the ask price of a security or asset.",
            "url": "https://www.investopedia.com/terms/s/spread.asp"
        }
    },
    {
        "Volatility": {
            "word": "Volatility",
            "meaning": "The degree of variation in the price of a security or asset over time.",
            "url": "https://www.investopedia.com/terms/v/volatility.asp"
        }
    },
    {
        "Candlestick Chart": {
            "word": "Candlestick Chart",
            "meaning": "A type of chart used in technical analysis to track the movement of a security or asset over time, displaying opening and closing prices as well as highs and lows.",
            "url": "https://www.investopedia.com/terms/c/candlestick.asp"
        }
    },
    {
        "Technical Analysis": {
            "word": "Technical Analysis",
            "meaning": "A method of analyzing securities or assets based on statistical trends and historical data, with the goal of predicting future price movements.",
            "url": "https://www.investopedia.com/terms/t/technicalanalysis.asp"
        }
    },
    {
        "Fundamental Analysis": {
            "word": "Fundamental Analysis",
            "meaning": "A method of analyzing securities or assets based on underlying economic and financial factors, such as earnings, revenue, and industry trends.",
            "url": "https://www.investopedia.com/terms/f/fundamentalanalysis.asp"
        }
    },
    {
        "HODL (hold on for dear life)": {
            "word": "HODL (hold on for dear life)",
            "meaning": "A strategy of holding onto a cryptocurrency for a long period of time, regardless of short-term price fluctuations.",
            "url": "https://www.investopedia.com/terms/h/hodl.asp"
        }
    },
    {
        "Pump and Dump": {
            "word": "Pump and Dump",
            "meaning": "A type of market manipulation where a group of traders artificially inflate the price of a security or asset, then sell it off quickly to make a profit.",
            "url": "https://www.investopedia.com/terms/p/pumpanddump.asp"
        }
    },
    {
        "Whale": {
            "word": "Whale",
            "meaning": "A trader or investor who holds a large amount of a particular cryptocurrency or asset, and can therefore influence its price movements.",
            "url": "https://www.investopedia.com/terms/w/whale.asp"
        }
    },
    {
        "Bull Market": {
            "word": "Bull Market",
            "meaning": "A market trend where prices of securities or assets are rising, indicating positive investor sentiment.",
            "url": "https://www.investopedia.com/terms/b/bullmarket.asp"
        }
    },
    {
        "Bear Market": {
            "word": "Bear Market",
            "meaning": "A market trend where prices of securities or assets are falling, indicating negative investor sentiment.",
            "url": "https://www.investopedia.com/terms/b/bearmarket.asp"
        }
    },
    {
        "FOMO (fear of missing out)": {
            "word": "FOMO (fear of missing out)",
            "meaning": "A feeling of anxiety or insecurity that can arise when investors see others profiting from a particular asset or security, and fear they will miss out on potential gains.",
            "url": "https://www.investopedia.com/terms/f/fomo.asp"
        }
    },
    {
        "FUD (fear, uncertainty, and doubt)": {
            "word": "FUD (fear, uncertainty, and doubt)",
            "meaning": "A strategy used to spread negative information or rumors about a particular asset or security, with the goal of creating fear and uncertainty among investors.",
            "url": "https://www.investopedia.com/terms/f/fud.asp"
        }
    },
    {
        "ATH": {
            "word": "ATH",
            "meaning": "All-time high - the highest price level that a particular cryptocurrency or asset has ever reached.",
            "url": "https://www.investopedia.com/terms/a/alltimehigh.asp"
        }
    },
    {
        "ATL": {
            "word": "ATL",
            "meaning": "All-time low - the lowest price level that a particular cryptocurrency or asset has ever reached.",
            "url": "https://www.investopedia.com/terms/a/alltimelow.asp"
        }
    },
    {
        "Market Capitalization": {
            "word": "Market Capitalization",
            "meaning": "The total value of all outstanding shares of a particular security or asset, calculated by multiplying the current price per share by the total number of shares outstanding.",
            "url": "https://www.investopedia.com/terms/m/marketcapitalization.asp"
        }
    },
    {
        "Proof of Work (PoW)": {
            "word": "Proof of Work (PoW)",
            "meaning": "A consensus mechanism used in blockchain networks where nodes compete to solve complex mathematical problems to validate transactions and create new blocks on the chain.",
            "url": "https://www.investopedia.com/terms/p/proof-of-work.asp"
        }
    },
    {
        "Proof of Stake (PoS)": {
            "word": "Proof of Stake (PoS)",
            "meaning": "A consensus mechanism used in blockchain networks where nodes validate transactions and create new blocks on the chain based on the amount of cryptocurrency they hold and 'stake' as collateral.",
            "url": "https://www.investopedia.com/terms/p/proof-stake-pos.asp"
        }
    },
    {
        "Decentralized Finance (DeFi)": {
            "word": "Decentralized Finance (DeFi)",
            "meaning": "A system of financial applications built on blockchain networks that aim to create a more open, transparent, and accessible financial system.",
            "url": "https://www.investopedia.com/terms/d/defi.asp"
        }
    },
    {
        "Initial Coin Offering (ICO)": {
            "word": "Initial Coin Offering (ICO)",
            "meaning": "A type of fundraising campaign for cryptocurrency projects, where new tokens are sold to investors in exchange for established cryptocurrencies or fiat currencies.",
            "url": "https://www.investopedia.com/terms/i/initial-coin-offering-ico.asp"
        }
    },
    {
        "Security Token Offering (STO)": {
            "word": "Security Token Offering (STO)",
            "meaning": "A type of fundraising campaign for cryptocurrency projects, where new tokens are sold to investors as securities that offer ownership rights or a share in profits.",
            "url": "https://www.investopedia.com/terms/s/security-token-offering-sto.asp"
        }
    },
    {
        "Smart Contract": {
            "word": "Smart Contract",
            "meaning": "A self-executing contract that automatically enforces the terms of an agreement written in code on a blockchain network.",
            "url": "https://www.investopedia.com/terms/s/smart-contracts.asp"
        }
    },
    {
        "Gas": {
            "word": "Gas",
            "meaning": "The unit of measure used to calculate the cost of a transaction or computational task on a blockchain network.",
            "url": "https://www.investopedia.com/terms/g/gas-ethereum.asp"
        }
    },
    {
        "Hashrate": {
            "word": "Hashrate",
            "meaning": "The computational power of a blockchain network, measured in the number of hashes per second that can be performed by the network.",
            "url": "https://www.investopedia.com/terms/h/hashrate.asp"
        }
    },
    {
        "Whitepaper": {
            "word": "Whitepaper",
            "meaning": "A document that outlines the technical details, goals, and potential use cases of a cryptocurrency or blockchain project.",
            "url": "https://www.investopedia.com/terms/w/whitepaper.asp"
        }
    },
    {
        "Stop Loss Order": {
            "word": "Stop Loss Order",
            "meaning": "An order placed to sell a security or asset if it reaches a specified price, used to limit potential losses.",
            "url": "https://www.investopedia.com/terms/s/stop-lossorder.asp"
        }
    },
    {
        "Margin Trading": {
            "word": "Margin Trading",
            "meaning": "A method of trading where an investor borrows funds from a broker to trade securities or assets, with the goal of generating higher returns.",
            "url": "https://www.investopedia.com/terms/m/margintrading.asp"
        }
    },
    {
        "Leverage": {
            "word": "Leverage",
            "meaning": "The use of borrowed funds to increase the potential return of an investment, but also increases the potential risk of losses.",
            "url": "https://www.investopedia.com/terms/l/leverage.asp"
        }
    },
    {
        "Private Key": {
            "word": "Private Key",
            "meaning": "A string of letters and numbers that serves as a password to access a cryptocurrency wallet and authorize transactions.",
            "url": "https://www.investopedia.com/terms/p/private-key.asp"
        }
    },
    {
        "Public Key": {
            "word": "Public Key",
            "meaning": "A unique address associated with a cryptocurrency wallet that can be shared with others to receive payments.",
            "url": "https://www.investopedia.com/terms/p/public-key.asp"
        }
    },
    {
        "Mining Pool": {
            "word": "Mining Pool",
            "meaning": "A group of miners who combine their computing power to increase their chances of earning rewards in a cryptocurrency network.",
            "url": "https://www.investopedia.com/terms/m/mining-pool.asp"
        }
    },
    {
        "Decentralized Exchange": {
            "word": "Decentralized Exchange",
            "meaning": "An exchange that operates on a decentralized blockchain network and allows users to trade cryptocurrencies without intermediaries.",
            "url": "https://www.investopedia.com/terms/d/decentralized-exchange-dex.asp"
        }
    },
    {
        "Centralized Exchange": {
            "word": "Centralized Exchange",
            "meaning": "An exchange that operates on a centralized server and requires users to deposit funds and trade through a centralized authority.",
            "url": "https://www.investopedia.com/terms/c/centralized-exchange.asp"
        }
    },
]

const getWordOfTheDay = () => {
    const data = wodData[Math.floor(Math.random() * wodData.length)];
    let objectkey = Object.keys(data)[0];
    let word = data[objectkey];
    return word;
}

module.exports = getWordOfTheDay