class Convention {
    constructor(config) {
      this.config = config; 
    }
  
    async initialize() {
    }
  
    async execute() {
      throw new Error('Execute method must be implemented by subclasses');
    }
  
    // Method to handle results of the convention execution
    handleResults(results) {

    }
  
    // Method to handle any errors from the convention execution
    handleError(error) {
    }
  }
  
  module.exports = Convention;
  