USE [cossim];
GO

/*
  Updates the existing procedure without replacing its unrelated SLA/task logic.
  Both filters accept comma-separated values, for example:
    @FromDCCode = N'DC-UB,DC-UAT'
    @ToDCCode   = N'DC-US,DC-UM'
*/
DECLARE @definition nvarchar(max) = OBJECT_DEFINITION(OBJECT_ID(N'dbo.spShipmentOrdersAll'));

IF @definition IS NULL
    THROW 50001, 'dbo.spShipmentOrdersAll was not found.', 1;

-- Retain the complete comma-separated input. The old locals truncated it to 50 characters.
SET @definition = REPLACE(
    @definition,
    N'DECLARE @FromDC NVARCHAR(50) = NULLIF(LTRIM(RTRIM(@FromDCCode)), N'''');',
    N'DECLARE @FromDC NVARCHAR(MAX) = NULLIF(LTRIM(RTRIM(@FromDCCode)), N'''');'
);
SET @definition = REPLACE(
    @definition,
    N'DECLARE @ToDC NVARCHAR(50) = NULLIF(LTRIM(RTRIM(@ToDCCode)), N'''');',
    N'DECLARE @ToDC NVARCHAR(MAX) = NULLIF(LTRIM(RTRIM(@ToDCCode)), N'''');'
);

-- Upgrade older single-DC predicates if the deployed procedure still has them.
SET @definition = REPLACE(
    @definition,
    N'AND (@FromDC IS NULL OR so.OriginDCCode = @FromDC)',
    N'AND (@FromDC IS NULL OR EXISTS
      (
          SELECT 1
          FROM STRING_SPLIT(@FromDC, N'','') selectedDC
          WHERE LTRIM(RTRIM(selectedDC.value)) = so.OriginDCCode
      ))'
);
SET @definition = REPLACE(
    @definition,
    N'AND (@ToDC IS NULL OR so.DestinationDCCode = @ToDC)',
    N'AND (@ToDC IS NULL OR EXISTS
      (
          SELECT 1
          FROM STRING_SPLIT(@ToDC, N'','') selectedDC
          WHERE LTRIM(RTRIM(selectedDC.value)) = so.DestinationDCCode
      ))'
);

-- OBJECT_DEFINITION returns CREATE/CREATE OR ALTER/ALTER depending on deployment history.
DECLARE @procedurePosition int = CHARINDEX(N'PROCEDURE', UPPER(@definition));
IF @procedurePosition = 0
    THROW 50002, 'The stored procedure definition is invalid.', 1;

SET @definition = N'ALTER ' + SUBSTRING(@definition, @procedurePosition, LEN(@definition));
EXEC sys.sp_executesql @definition;
GO

/* Verification: the result must contain orders belonging to either selected destination. */
EXEC dbo.spShipmentOrdersAll
    @PageNo = 1,
    @PageSize = 100,
    @FromDCCode = NULL,
    @ToDCCode = N'DC-UB,DC-UAT',
    @CheckSLA = 0;
GO
