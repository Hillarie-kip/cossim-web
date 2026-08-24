export const DistributionCenterTypes = {
    100: "DC",
    200: "Packaging Center",
    300: "Route Price"
};

export const PAYMENT_METHODS = {
    MPESA: {
        id: 'mpesa',
        name: 'M-Pesa',
        code: 1
    },
    CASH: {
        id: 'cash',
        name: 'Cash',
        code: 2
    },
    VENDOR_ACCOUNT: {
        id: 'vendor_account',
        name: 'Vendor Account',
        code: 3
    },
    CARD: {
        id: 'card',
        name: 'Card',
        code: 4
    },
    BANK_TRANSFER: {
        id: 'bank',
        name: 'Bank Transfer',
        code: 5
    },
    CLIENT_STK: {
        id: 'client_stk',
        name: 'Client STK Push',
        code: 6
    }
};

export const CUSTOMERS_WITH_VENDOR_STK = [
    'V-UUA',
];


export const DCOrderTypes = {
    ALL: 'ALL',
    INBOUND: 'INBOUND',
    OUTBOUND: 'OUTBOUND'
};
