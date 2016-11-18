<?php
/**
 * Created by PhpStorm.
 * User: liudong
 * Date: 2016/11/15
 * Time: 11:19
 */
/*echo "登录成功！";
print_r($_GET);
print_r($_POST);
$a = array ('a' => 'apple', 'b' => 'banana', 'c' => array ('x','y','z'));
print_r ($a);*/
if(empty($_GET)){
    $root_path="http://".$_SERVER['HTTP_HOST'];
    header("Location: $root_path");
}else{
    if($_GET["account"]=="author"){
        require "login.html";
    }else{
        if($_GET["step"]=="register"){
            require "register.html";
        }else{
            header("Location: ysw-reader/index.php");
        }
    }
}
?>