// Create a connection to the rosbridge WebSocket server.
var ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

// Connection error handler
ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
    document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Error connecting to websocket server.</p>');
});

// Connection established handler
ros.on('connection', function() {
    console.log('Connected to websocket server.');

    // Define the blacklist
    var blacklist = ['/rosbridge_websocket', '/rosapi', '/rosout'];

    // Get the list of nodes
    var nodesClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/nodes',
        serviceType: 'rosapi/Nodes'
    });

    var nodeDetailsClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/node_details',
        serviceType: 'rosapi/NodeDetails'
    });

    var request = new ROSLIB.ServiceRequest();

    nodesClient.callService(request, function(result) {
        // Filter and sort nodes
        var filteredNodes = result.nodes.filter(function(node) {
            return !blacklist.includes(node);
        }).sort();

        var nodesDetails = [];

        // Fetch details for each node
        filteredNodes.forEach(function(node, index) {
            var nodeRequest = new ROSLIB.ServiceRequest({ node: node });

            nodeDetailsClient.callService(nodeRequest, function(nodeResult) {
                // Filter out '/rosout' from subscribed and published topics
                var subscribedTopics = nodeResult.subscribing.filter(topic => topic !== '/rosout').join(', ');
                var publishedTopics = nodeResult.publishing.filter(topic => topic !== '/rosout').join(', ');

                // Filter out services ending with get_loggers or set_logger_level
                var filteredServices = nodeResult.services.filter(service => {
                    return !service.endsWith('get_loggers') && !service.endsWith('set_logger_level');
                });
                var services = filteredServices.join(', ');

                nodesDetails.push({
                    node: node,
                    subscribedTopics: subscribedTopics,
                    publishedTopics: publishedTopics,
                    services: services
                });

                // Only render the table after all details are fetched
                if (nodesDetails.length === filteredNodes.length) {
                    // Sort nodesDetails by node name
                    nodesDetails.sort((a, b) => a.node.localeCompare(b.node));

                    var nodesTableBody = document.getElementById('nodesTable').querySelector('tbody');
                    nodesTableBody.innerHTML = '';

                    nodesDetails.forEach(function(nodeDetail) {
                        var row = document.createElement('tr');
                        var nodeNameCell = document.createElement('td');
                        var subscribedTopicsCell = document.createElement('td');
                        var publishedTopicsCell = document.createElement('td');
                        var servicesCell = document.createElement('td');

                        nodeNameCell.textContent = nodeDetail.node;
                        subscribedTopicsCell.textContent = nodeDetail.subscribedTopics;
                        publishedTopicsCell.textContent = nodeDetail.publishedTopics;
                        servicesCell.textContent = nodeDetail.services;

                        row.appendChild(nodeNameCell);
                        row.appendChild(subscribedTopicsCell);
                        row.appendChild(publishedTopicsCell);
                        row.appendChild(servicesCell);

                        nodesTableBody.appendChild(row);
                    });
                }
            });
        });
    }, function(error) {
        console.log('Error calling service: ', error);
        document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Error calling service.</p>');
    });
});

// Connection closed handler
ros.on('close', function() {
    console.log('Connection to websocket server closed.');
    document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Connection to websocket server closed.</p>');
});
