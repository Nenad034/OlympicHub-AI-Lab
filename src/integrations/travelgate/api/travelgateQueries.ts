// =============================================================================
// Travelgate Hotel-X — GraphQL Queries & Mutations
// =============================================================================

export const TRAVELGATE_SEARCH_QUERY = `
query HotelXSearch($criteriaSearch: HotelCriteriaSearchInput!, $settings: HotelSettingsInput, $filterSearch: FilterInput) {
  hotelX {
    search(
      criteria: $criteriaSearch
      settings: $settings
      filterSearch: $filterSearch
    ) {
      options {
        id
        supplierCode
        accessCode
        market
        hotelCode
        hotelCodeSupplier
        hotelName
        boardCode
        boardName
        paymentType
        status
        occupancies {
          id
          paxes { age }
        }
        rooms {
          occupancyRefId
          code
          supplierCode
          description
          refundable
          beds { type count shared description }
          rateplans { code name }
          totalStayPrice {
            currency
            binding
            net
            gross
          }
        }
        price {
          currency
          binding
          net
          gross
          breakdown {
            effectiveDate
            expireDate
            price { currency net gross }
          }
        }
        surcharges {
          chargeType
          mandatory
          price { currency net gross }
          description
        }
        rateRules
        cancelPolicy {
          refundable
          cancelPenalties {
            hoursBefore
            penaltyType
            currency
            value
            deadline
          }
        }
        remarks
      }
      errors { code type description }
      warnings { code type description }
    }
  }
}
`;

export const TRAVELGATE_QUOTE_QUERY = `
query HotelXQuote($criteriaQuote: HotelCriteriaQuoteInput!, $settings: HotelSettingsInput) {
  hotelX {
    quote(
      criteria: $criteriaQuote
      settings: $settings
    ) {
      optionQuote {
        optionRefId
        status
        price {
          currency
          binding
          net
          gross
          breakdown {
            effectiveDate
            expireDate
            price { currency net gross }
          }
        }
        cancelPolicy {
          refundable
          cancelPenalties {
            hoursBefore
            penaltyType
            currency
            value
            deadline
          }
        }
        surcharges {
          chargeType
          mandatory
          price { currency net gross }
          description
        }
        remarks
      }
      errors { code type description }
      warnings { code type description }
    }
  }
}
`;

export const TRAVELGATE_BOOK_MUTATION = `
mutation HotelXBook($bookInput: HotelBookInput!, $settings: HotelSettingsInput) {
  hotelX {
    book(
      input: $bookInput
      settings: $settings
    ) {
      booking {
        id
        clientReference
        supplierReference
        status
        price {
          currency
          binding
          net
          gross
        }
        cancelPolicy {
          refundable
          cancelPenalties {
            hoursBefore
            penaltyType
            currency
            value
            deadline
          }
        }
        hotel {
          hotelCode
          hotelName
          checkIn
          checkOut
          boardCode
          boardName
          rooms {
            occupancyRefId
            code
            description
          }
        }
        holder { name surname }
        payable
      }
      errors { code type description }
      warnings { code type description }
    }
  }
}
`;

export const TRAVELGATE_CANCEL_MUTATION = `
mutation HotelXCancel($cancelInput: HotelCancelInput!, $settings: HotelSettingsInput) {
  hotelX {
    cancel(
      input: $cancelInput
      settings: $settings
    ) {
      booking {
        id
        clientReference
        supplierReference
        status
        cancelPolicy {
          refundable
          cancelPenalties {
            hoursBefore
            penaltyType
            currency
            value
            deadline
          }
        }
        price { currency net gross }
      }
      errors { code type description }
      warnings { code type description }
    }
  }
}
`;

export const TRAVELGATE_BOOKING_LIST_QUERY = `
query HotelXBookingList(
  $filterBookingList: HotelBookingFilterInput!
  $bookingType: BookingTypeFilterEnum
  $settings: HotelSettingsInput
) {
  hotelX {
    bookingList(
      filterBookingList: $filterBookingList
      bookingType: $bookingType
      settings: $settings
    ) {
      bookings {
        id
        clientReference
        supplierReference
        status
        hotel {
          hotelCode
          hotelName
          checkIn
          checkOut
          boardCode
          boardName
        }
        price { currency net gross }
        holder { name surname }
      }
      errors { code type description }
      warnings { code type description }
    }
  }
}
`;
