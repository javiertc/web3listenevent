import { createPublicClient, webSocket, formatUnits } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { usdcAbi } from './usdc-abi.mjs'; // Ensure this includes the Transfer event

// Your wallet address (case-insensitive comparison)
const MY_WALLET = '0x8ae323046633A07FB162043f28Cea39FFc23B50A'.toLowerCase(); //Chrome

async function monitorTransfers() {
    try {
        // USDC.e contract address on Avalanche Fuji
        const usdcAddress = '0x5425890298aed601595a70AB815c96711a31Bc65';

        // Set up the WebSocket client for Avalanche Fuji
        const client = createPublicClient({
            chain: avalancheFuji,
            transport: webSocket('wss://api.avax-test.network/ext/bc/C/ws'),
        });

        // Watch for Transfer events on the USDC contract
        client.watchContractEvent({
            address: usdcAddress,
            abi: usdcAbi,
            eventName: 'Transfer',
            onLogs: (logs) => {
                logs.forEach((log) => {
                    const { from, to, value } = log.args;
                    const toLower = to.toLowerCase();

                    // Filter for transactions where 'from' matches your wallet
                    if (toLower === MY_WALLET) {
                        console.log('*******');
                        console.log('Transfer to my wallet:');
                        console.log(`From: ${from}`);
                        console.log(`To: ${to}`);
                        console.log(`Value: ${formatUnits(value, 6)} USDC`); // USDC has 6 decimals
                        console.log(`Transaction Hash: ${log.transactionHash}`);
                    }
                });
            },
            onError: (error) => {
                console.error('Event watching error:', error.message);
            },
        });

        console.log('Monitoring incoming USDC Transfer events on Fuji...');
    } catch (error) {
        console.error('Error setting up transfer monitoring:', error.message);
    }
}

// Start monitoring
monitorTransfers();