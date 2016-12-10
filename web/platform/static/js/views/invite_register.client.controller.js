$(function(){
    var login = new LoginFramework($('body'));
});
function LoginFramework(container)
{
    var Element =
    {
        Register:
        {
            Container: container.find('.register-container'),
            EmailBox: container.find('.email'),
            PasswordBox: container.find('.password'),
            EnviteCodeBox: container.find('.envite-code'),
            ReadMeIcon: container.find('.read-me .icon'),
            ReadMe:  container.find('#readMe'),
            UserName: container.find('#username'),
            Password: container.find('#password'),
            VerifyCode: container.find('#verifyCode'),
            Form: container.find('#registerForm'),
            Submit: container.find('#register'),
            RequestVerifyCode: container.find('#requestVerifyCode')
        }
    };

    var Placeholder =
    {
        Username: Element.Register.UserName.attr('placeholder'),
        Password: Element.Register.Password.attr('placeholder'),
        VerifyCode: Element.Register.VerifyCode.attr('placeholder')
    };

    (function(){

        var params = GetQueryParams();
        var username  = unescape(params.username);
        var verifyCode = params.verifycode;
        if(username )
        {
            Element.Register.UserName.attr("readonly","readonly").val(username);

            if(verifyCode)
                Element.Register.VerifyCode.attr("readonly","readonly").val(verifyCode);
        }

        Element.Register.RequestVerifyCode.click(function(){
            if(IsNullOrEmpty(Element.Register.UserName))
                alert("请先输入申请的邮箱！");

            EmailFormatValid();
            if(!Element.Register.EmailBox.hasClass('error'))
            {
                $.ajax({
                    data: Element.Register.Form.serialize(),
                    type: 'post',
                    url: '/public/rest/verify',
                    dataType: 'json'
                }).done(function(data){
                    alert('申请成功！请进入邮箱获取邀请码！');
                }).fail(function(){
                    alert('申请失败！请重新申请')
                });
            }
        });

        Element.Register.Submit.click(function(){
            if(!RegisterValid())
                return;

            $(this).attr('disabled', 'disabled');
            $.ajax({
                data: Element.Register.Form.serialize(),
                type:'post',
                url:"public/rest/register",
                dataType:'json'
            }).done(function(data)
            {
                var code = data.errcode;
                switch(code){
                    case 2:
                    {
                        ShowError(Element.Register.EmailBox, "该用户已存在");
                        break;
                    }
                    case 4:
                    {
                        ShowError(Element.Register.EnviteCodeBox, "邀请码无效");
                        $(this).removeAttr('disabled');
                        //去除禁用 $('#register').removeAttr('disabled');
                        break;
                    }
                    case 6:
                    {
                        ShowError(Element.Register.EmailBox, "用户名或口令不符合要求");
                        ShowError(Element.Register.PasswordBox, "用户名或口令不符合要求");
                        $(this).removeAttr('disabled');
                        break;
                    }
                    case 0:
                    {

                        if(data.url){
                            $.ajax(
                                {data:
                                {
                                    username: Element.Register.UserName.val(),
                                    password: Element.Register.Password.val()
                                },
                                    type:'post',
                                    url:"public/rest/login",
                                    dataType:'json'
                                }).done(function(data)
                                {
                                    if(data.url){
                                        window.location = data.url;
                                    }
                                }).fail(function( jqXHR, textStatus, errorThrown ) {
                                    alert('登录失败，请重试');
                                    window.location = data.url;
                                });
                        }
                        break;
                    }
                    default:
                        break;
                }

            }).fail(function( jqXHR, textStatus, errorThrown ) {
                alert('注册失败，请刷新页面重试');
                $(this).removeAttr('disabled');
            });
        });

        Element.Register.UserName.focus(function()
        {
            $(this).attr('placeholder','');
            $(this).select();
        }).blur(function()
        {
            $(this).attr('placeholder',Placeholder.UserName);
            if(IsNullOrEmpty(Element.Register.UserName.val()))
            {
                HideError(Element.Register.EmailBox);
                return ;
            }
            EmailFormatValid();
        });

        Element.Register.VerifyCode.focus(function()
        {
            $(this).attr('placeholder','');
        }).blur(function()
        {
            $(this).attr('placeholder',Placeholder.VerifyCode);
            if(!IsNullOrEmpty($(this).val()))
                HideError($(this).parent());
        });

        Element.Register.ReadMeIcon.click(function()
        {
            $(this).toggleClass('selected');
            Element.Register.ReadMe.parent().removeClass('error');
            Element.Register.ReadMe.val($(this).hasClass('selected'));
        });

        Element.Register.Password.focus(function(){
            $(this).attr('placeholder','');
        }).blur(function(){
            $(this).attr('placeholder',Placeholder.Password);
            if(!IsNullOrEmpty($(this).val()))
                HideError($(this).parent());
        });


        document.onkeydown = function (e) {
            var theEvent = window.event || e;
            var code = theEvent.keyCode || theEvent.which;
            if (code == 13) {
                Element.Register.Submit.click();
                return false;
            }
        };
    })();

    function EmailFormatValid()
    {
        var patten = new RegExp(/^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,}){1,2})$/);
        if(patten.test(Element.Register.UserName.val()) ==  false)
            ShowError(Element.Register.EmailBox, "邮箱格式匹配不正确。如:tom@zhuzhuqs.com");
        else
            HideError(Element.Register.EmailBox);
    };

    function RegisterValid()
    {
        EmailFormatValid();
        EmailNullCheck();
        PasswordNullCheck();
        EnviteCodeNullCheck();

        if(!Element.Register.EmailBox.hasClass('error') && !Element.Register.Password.hasClass('error') && ! Element.Register.EnviteCodeBox.hasClass('error') && ReadMeNullCheck())
            return true;
        else
            return false;
    };

    function EmailNullCheck()
    {
        if(IsNullOrEmpty(Element.Register.UserName.val()))
            ShowError(Element.Register.EmailBox, "邮箱不能为空！");
    };
    function PasswordNullCheck()
    {
        if(IsNullOrEmpty(Element.Register.Password.val()))
            ShowError(Element.Register.PasswordBox, "密码不能为空！");
    };
    function EnviteCodeNullCheck()
    {
        if(IsNullOrEmpty(Element.Register.VerifyCode.val()))
            ShowError(Element.Register.EnviteCodeBox, "邀请码不能为空！");
    };
    function ReadMeNullCheck()
    {
        var isReaded = IsTrue(Element.Register.ReadMe.val());
        if(!isReaded)
            Element.Register.ReadMe.parent().addClass('error');

        return isReaded;
    };

    function ShowError(element, message)
    {
        element.find('.tip').text(message);
        element.addClass('error');
    };

    function HideError(element)
    {
        element.find('.tip').text('');
        element.removeClass('error');
    };
};
