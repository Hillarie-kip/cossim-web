/**
 * Demo component showing how to use the shipment timeline functionality
 */

import React, { useState } from 'react';
import { useShipment } from '@/hooks/useShipment';

const ShipmentTimelineDemo = () => {
  const { 
    shipmentTimeline, 
    loading, 
    error, 
    fetchShipmentTimeline 
  } = useShipment();
  
  const [orderNo, setOrderNo] = useState('');

  const handleFetchTimeline = async () => {
    if (!orderNo.trim()) {
      alert('Please enter an order number');
      return;
    }

    try {
      await fetchShipmentTimeline({ orderNo: orderNo.trim() });
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Shipment Timeline Demo</h2>
      
      {/* Input Section */}
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label htmlFor="orderNo" className="block text-sm font-medium text-gray-700 mb-2">
            Order Number
          </label>
          <input
            id="orderNo"
            type="text"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="Enter order number (e.g., PCK-T-AS2MWH1G60RG)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleFetchTimeline}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Timeline'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Timeline Display */}
      {shipmentTimeline.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              Timeline for Order: {shipmentTimeline[0]?.OrderNO}
            </h3>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {shipmentTimeline.map((event, index) => (
                <div key={event.EventID || index} className="flex">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    {index < shipmentTimeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 pb-8">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {event.StatusName}
                        </h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {event.PhaseCode}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{event.Description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <strong>DC:</strong> {event.DCName} ({event.DCCode})
                        </div>
                        <div>
                          <strong>Event Time:</strong> {formatDateTime(event.EventTime)}
                        </div>
                        <div>
                          <strong>Sequence:</strong> {event.SequenceNo}
                        </div>
                        <div>
                          <strong>Sort Order:</strong> {event.SortOrder}
                        </div>
                      </div>
                      
                      {event.Notes && (
                        <div className="mt-2 text-sm">
                          <strong>Notes:</strong> {event.Notes}
                        </div>
                      )}
                      
                      {event.ActorName && (
                        <div className="mt-2 text-sm">
                          <strong>Actor:</strong> {event.ActorName} ({event.ActorUserCode})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && shipmentTimeline.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          Enter an order number and click "Fetch Timeline" to view shipment timeline
        </div>
      )}
    </div>
  );
};

export default ShipmentTimelineDemo;
