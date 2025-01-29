import pickle
import zlib

class Codec:

    """
    Codec class to ingest and digest data in a dictionary format.
    """

    def __init__(
        self,
        should_compress: bool = True,
    ):
        self.should_compress = should_compress

    def pickle(self, data):
        return pickle.dumps(data)
    
    def unpickle(self, data):
        return pickle.loads(data)
    
    def compress(self, data):
        return zlib.compress(data)
    
    def decompress(self, data):
        return zlib.decompress(data)
    
    def _encode_hex_pickle(self, pickle):
        return pickle.hex().encode('utf-8')
    
    def _decode_hex_pickle(self, str_pickle: str):
        return bytes.fromhex(str_pickle)
    
    def ingest(self, data_dict):
        
        # Pickle the dictionary
        pickled_data = self.pickle(data_dict)
        
        if self.should_compress:
            
            # Compress the data
            compressed_data = self.compress(pickled_data)
        
            return compressed_data.hex() #.encode('utf-8').decode('utf-8')
        
        return self._encode_hex_pickle(pickled_data).decode('utf-8')

    def digest(self, data_hex):
        if self.should_compress:
            # Decompress the data
            data = self.decompress(self._decode_hex_pickle(data_hex))
        else:
            data = self._decode_hex_pickle(data_hex)
        
        # Unpickle the decoded data
        return self.unpickle(data)

if __name__ == '__main__':
    
    print("Running without compression")
    
    codec_raw = Codec(should_compress=False)
    
    # Example usage
    data_dict = {'key1': 'value1', 'key2': 'value2'}
    hex_data = codec_raw.ingest(data_dict)
    print(f"Hex Data: {hex_data}")

    decode = codec_raw.digest(hex_data)
    print(f"Decoded Data: {decode}")
    
    print()
    
    print("Running with compression")
    codec_compressed = Codec(should_compress=True)
    
    # Example usage
    data_dict = {'key1': 'value1', 'key2': 'value2'}
    hex_data = codec_compressed.ingest(data_dict)
    print(f"Hex Data: {hex_data}")
    
    decode = codec_compressed.digest(hex_data)
    print(f"Decoded Data: {decode}")
    
