pragma solidity ^0.8.20;

contract Oracle {
    address public owner;
    mapping(address => mapping(string => uint256)) private prices;  //A mapping of each trusted source to a mapping of their submitted prices for each currency
    mapping(address => bool) public trustedSourcesMap;
    mapping(string => uint256) public medianPrices;
    address[] trustedSources;
    string nativeToken;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyTrustedSource() {
        require(trustedSourcesMap[msg.sender], "Only trusted sources can call this function");
        _;
    }

    constructor(string memory _nativeToken) {    //"ETH.ETH" for ethereum, "AVAX.AVAX" for avax
        owner = msg.sender;
        nativeToken = _nativeToken;
        medianPrices[nativeToken] = 1000;   //The native token
    }

    // Adds a trusted source
    function addTrustedSource(address source) public onlyOwner {
        trustedSourcesMap[source] = true;
        trustedSources.push(source);
    }

    // Removes a trusted source
    function removeTrustedSource(address source) public onlyOwner {
        trustedSourcesMap[source] = false;
        for (uint i = 0; i < trustedSources.length; i++){
            if(trustedSources[i] == source){
                trustedSources[i] = trustedSources[trustedSources.length-1];
                trustedSources.pop();
                return;
            }
        }
    }

    // Trusted sources submit prices
    function submitPrice(string memory asset, uint256 price) public onlyTrustedSource {
        //require(asset != nativeToken, "Cannot change the relative value of the native token");
        prices[msg.sender][asset] = price;
        medianPrices[asset] = calculateMedian(asset);
    }

    function calculateMedian(string memory asset) view internal returns (uint256) {
        uint sum = 0;
        uint count = 0;
        for (uint i = 0; i < trustedSources.length; i++){
            uint temp = prices[trustedSources[i]][asset];
            if (temp != 0){
                sum += temp;
                count++;
            }
        }
        if(count == 0){
            return 0;
        }
        return sum/count;
    }

    // Gets the median price of the asset
    function getPrice(string memory asset) public view returns (uint256) {
        return medianPrices[asset];
    }

    function getExchangeRate(uint amount, string memory sourceAsset, string memory targetAsset) external view returns (uint) {
        return (getPrice(sourceAsset) * amount)/getPrice(targetAsset);
    }
}
