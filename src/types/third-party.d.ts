export type EasySlipResponse = {
    status: number
    data: {
        payload: string
        transRef: string
        date: string
        countryCode: string
        amount: {
            amount: number
            local: {
                amount?: number
                currency?: string
            }
        }
        fee?: number
        ref1?: string
        ref2?: string
        ref3?: string
        sender: {
            bank: {
                id?: string
                name?: string
                short?: string
            }
            account: {
                name: {
                    th?: string
                    en?: string
                }
                bank?: {
                    type: 'BANKAC' | 'TOKEN' | 'DUMMY'
                    account: string
                }
                proxy?: {
                    type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID'
                    account: string
                }
            }
        }
        receiver: {
            bank: {
                id: string
                name?: string
                short?: string
            }
            account: {
                name: {
                    th?: string
                    en?: string
                }
                bank?: {
                    type: 'BANKAC' | 'TOKEN' | 'DUMMY'
                    account: string
                }
                proxy?: {
                    type: 'NATID' | 'MSISDN' | 'EWALLETID' | 'EMAIL' | 'BILLERID'
                    account: string
                }
            }
            merchantId?: string
        }
    }
}
