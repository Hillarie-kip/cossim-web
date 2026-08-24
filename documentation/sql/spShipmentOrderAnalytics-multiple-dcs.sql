USE [cossim];
GO

/* Enable comma-separated origin and destination filters in dashboard analytics. */
DECLARE @definition nvarchar(max) = OBJECT_DEFINITION(OBJECT_ID(N'dbo.spShipmentOrderAnalytics'));
IF @definition IS NULL THROW 50001, 'dbo.spShipmentOrderAnalytics was not found.', 1;

SET @definition = REPLACE(@definition, N'@OriginDCCode       NVARCHAR(50)', N'@OriginDCCode       NVARCHAR(MAX)');
SET @definition = REPLACE(@definition, N'@DestinationDCCode  NVARCHAR(50)', N'@DestinationDCCode  NVARCHAR(MAX)');

SET @definition = REPLACE(
    @definition,
    N'OR so.OriginDCCode = @OriginDCCode',
    N'OR EXISTS
          (
              SELECT 1
              FROM STRING_SPLIT(@OriginDCCode, N'','') selectedDC
              WHERE LTRIM(RTRIM(selectedDC.value)) = so.OriginDCCode
          )'
);
SET @definition = REPLACE(
    @definition,
    N'OR so.DestinationDCCode =
              @DestinationDCCode',
    N'OR EXISTS
          (
              SELECT 1
              FROM STRING_SPLIT(@DestinationDCCode, N'','') selectedDC
              WHERE LTRIM(RTRIM(selectedDC.value)) = so.DestinationDCCode
          )'
);

DECLARE @procedurePosition int = CHARINDEX(N'PROCEDURE', UPPER(@definition));
IF @procedurePosition = 0 THROW 50002, 'The stored procedure definition is invalid.', 1;
SET @definition = N'ALTER ' + SUBSTRING(@definition, @procedurePosition, LEN(@definition));
EXEC sys.sp_executesql @definition;
GO

EXEC dbo.spShipmentOrderAnalytics
    @OriginDCCode = N'DC-UB,DC-UAT',
    @DestinationDCCode = N'DC-US,DC-UM';
GO
