import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer


class MockNodeHandler(BaseHTTPRequestHandler):
    """Handles incoming requests from the payment service."""
    
    received_requests = []
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        # Store the request for assertions
        MockNodeHandler.received_requests.append({
            'path': self.path,
            'headers': dict(self.headers),
            'body': json.loads(body.decode('utf-8')),
        })
        
        # Respond with success
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass


class MockNodeServer:
    """Starts a simple HTTP server to mock the Node.js backend."""
    
    def __init__(self, port=8765):
        self.port = port
        self.server = HTTPServer(('localhost', self.port), MockNodeHandler)
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.daemon = True
    
    def start(self):
        self.thread.start()
        return f"http://localhost:{self.port}"
    
    def stop(self):
        self.server.shutdown()
        self.server.server_close()
    
    def clear_requests(self):
        MockNodeHandler.received_requests = []
    
    def get_requests(self):
        return MockNodeHandler.received_requests