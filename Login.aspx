<%@ Page Language="C#" AutoEventWireup="true" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Login</title>
  	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js" type="text/javascript"></script>
    <script src="Scripts/jquery.ba-bbq.js" type="text/javascript"></script>
    <script type="text/javascript">
      function SucceedLogin() {
        $("#AuthenticationCode").first().attr("value", '<%=ConfigurationManager.AppSettings["aviationAuthenticationCode"]%>');
        var qs = $.deparam.querystring(true);
        if (qs.ReturnUrl) {
          var url = document.location.href.substring(0, document.location.href.indexOf(document.location.pathname)) + qs.ReturnUrl;
          $("#authForm").first().attr("action", url);
          $("#authForm").first().submit();
        }
      }
      function FailLogin() {
        $("#authForm").first().submit();
      }
    </script>
</head>
<body>
  <form id="authForm" method="post" action="">
    <input id="AuthenticationCode" name="AuthenticationCode" type="hidden" /> 
    <button onclick="javascript:SucceedLogin();">Login Succeeded</button>
    <button onclick="javascript:FailLogin();">Login Failed</button>
  </form>
</body>
</html>
